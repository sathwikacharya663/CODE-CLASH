const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const PISTON_API_URL = process.env.PISTON_API_URL || 'https://emkc.org/api/v2/piston';

const LANGUAGE_VERSIONS = {
  python: '3.10.0',
  c: '10.2.0',
  cpp: '10.2.0',
  java: '15.0.2',
};

const PISTON_LANG_NAMES = {
  python: 'python',
  c: 'c',
  cpp: 'cpp',
  java: 'java',
};

/**
 * Execute code using Piston API
 */
async function executeViaPiston(code, language, stdin = '') {
  const lang = PISTON_LANG_NAMES[language] || language;
  const version = LANGUAGE_VERSIONS[language] || '*';

  const response = await axios.post(
    `${PISTON_API_URL}/execute`,
    {
      language: lang,
      version,
      files: [{ content: code }],
      stdin,
      run_timeout: 5000,
      compile_timeout: 10000,
    },
    { timeout: 12000 }
  );

  const data = response.data;
  const compile = data.compile || {};
  const run = data.run || {};

  if (compile.code !== undefined && compile.code !== 0) {
    return {
      output: '',
      error: compile.stderr || compile.output || 'Compilation failed',
      timedOut: false,
      compileError: true,
    };
  }

  if (run.code === null || run.signal === 'SIGKILL') {
    return {
      output: run.stdout ? run.stdout.trim() : '',
      error: 'Time Limit Exceeded',
      timedOut: true,
    };
  }

  if (run.stderr && run.stderr.trim()) {
    return {
      output: run.stdout ? run.stdout.trim() : '',
      error: run.stderr.trim(),
      timedOut: false,
    };
  }

  return {
    output: run.stdout ? run.stdout.trim() : '',
    error: '',
    timedOut: false,
  };
}

/**
 * Local safe runner fallback (handles offline LAN or unreachable Piston)
 */
function executeLocally(code, language, stdin = '') {
  return new Promise((resolve) => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codeclash-'));
    const lang = (language || 'python').toLowerCase();

    let sourceFile = '';
    let compileCmd = null;
    let runCmd = '';
    let runArgs = [];

    if (lang === 'python') {
      sourceFile = path.join(tmpDir, 'solution.py');
      fs.writeFileSync(sourceFile, code);
      runCmd = 'python';
      runArgs = [sourceFile];
    } else if (lang === 'c') {
      sourceFile = path.join(tmpDir, 'solution.c');
      const binFile = path.join(tmpDir, 'solution.exe');
      fs.writeFileSync(sourceFile, code);
      compileCmd = { cmd: 'gcc', args: ['-O2', sourceFile, '-o', binFile] };
      runCmd = binFile;
      runArgs = [];
    } else if (lang === 'cpp') {
      sourceFile = path.join(tmpDir, 'solution.cpp');
      const binFile = path.join(tmpDir, 'solution.exe');
      fs.writeFileSync(sourceFile, code);
      compileCmd = { cmd: 'g++', args: ['-O2', sourceFile, '-o', binFile] };
      runCmd = binFile;
      runArgs = [];
    } else if (lang === 'java') {
      sourceFile = path.join(tmpDir, 'Solution.java');
      fs.writeFileSync(sourceFile, code);
      compileCmd = { cmd: 'javac', args: [sourceFile] };
      runCmd = 'java';
      runArgs = ['-cp', tmpDir, 'Solution'];
    } else {
      resolve({ output: '', error: `Unsupported language: ${language}`, timedOut: false });
      return;
    }

    const cleanup = () => {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch { }
    };

    const runProcess = () => {
      let stdout = '';
      let stderr = '';
      let isTimedOut = false;

      const proc = spawn(runCmd, runArgs, {
        cwd: tmpDir,
        env: { ...process.env, PYTHONUNBUFFERED: '1' },
      });

      const timer = setTimeout(() => {
        isTimedOut = true;
        try {
          proc.kill('SIGKILL');
        } catch { }
      }, 5000); // 5 sec execution timeout

      if (stdin) {
        try {
          proc.stdin.write(stdin);
          proc.stdin.end();
        } catch { }
      } else {
        try {
          proc.stdin.end();
        } catch { }
      }

      proc.stdout.on('data', (d) => {
        stdout += d.toString();
        if (stdout.length > 50000) {
          // Output limit
          proc.kill('SIGKILL');
        }
      });

      proc.stderr.on('data', (d) => {
        stderr += d.toString();
      });

      proc.on('close', (code) => {
        clearTimeout(timer);
        cleanup();

        if (isTimedOut) {
          resolve({ output: stdout.trim(), error: 'Time Limit Exceeded', timedOut: true });
        } else if (stderr.trim()) {
          resolve({ output: stdout.trim(), error: stderr.trim(), timedOut: false });
        } else {
          resolve({ output: stdout.trim(), error: '', timedOut: false });
        }
      });

      proc.on('error', (err) => {
        clearTimeout(timer);
        cleanup();
        resolve({ output: stdout.trim(), error: err.message, timedOut: false });
      });
    };

    if (compileCmd) {
      const comp = spawn(compileCmd.cmd, compileCmd.args, { cwd: tmpDir });
      let compErr = '';

      const compTimer = setTimeout(() => {
        try { comp.kill('SIGKILL'); } catch { }
      }, 10000); // 10 sec compile timeout

      comp.stderr.on('data', (d) => { compErr += d.toString(); });
      comp.on('close', (code) => {
        clearTimeout(compTimer);
        if (code !== 0) {
          cleanup();
          resolve({
            output: '',
            error: compErr.trim() || 'Compilation failed',
            timedOut: false,
            compileError: true,
          });
        } else {
          runProcess();
        }
      });
      comp.on('error', (err) => {
        clearTimeout(compTimer);
        cleanup();
        resolve({ output: '', error: `Compiler error: ${err.message}`, timedOut: false, compileError: true });
      });
    } else {
      runProcess();
    }
  });
}

/**
 * Main execute dispatcher: tries Piston first, falls back to safe local execution.
 */
async function execute(code, language, stdin = '') {
  try {
    return await executeViaPiston(code, language, stdin);
  } catch (pistonErr) {
    // If Piston is unreachable (e.g. 401, offline LAN, timeout), use local executor
    return await executeLocally(code, language, stdin);
  }
}

module.exports = { execute };
