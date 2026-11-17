const codeExecutor = require('./codeExecutor');
const { TIME_BONUS_PERCENT } = require('../config/constants');

function normalizeOutput(str) {
  if (!str) return '';
  return str
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .trim();
}

/**
 * Evaluate code against all test cases for a question.
 * @param {Object} question - Mongoose Question document
 * @param {string} code
 * @param {string} language
 * @param {number} wrongSubmissions - Previous wrong submission count
 * @param {boolean} inFirstHalf - Whether submission is in first half of round time
 * @param {number} round - Round number
 * @returns {Object} evaluation result
 */
async function evaluate(question, code, language, wrongSubmissions = 0, inFirstHalf = false, round = 1) {
  const testCases = question.testCases || [];
  const testCaseResults = [];
  let totalTestsPassed = 0;

  for (const tc of testCases) {
    const start = Date.now();
    let result;
    try {
      result = await codeExecutor.execute(code, language, tc.input || '');
    } catch (err) {
      result = { output: '', error: err.message, timedOut: false };
    }
    const timeTaken = Date.now() - start;

    if (result.timedOut) {
      testCaseResults.push({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: 'TLE',
        passed: false,
        timeTaken,
      });
      continue;
    }

    if (result.error && !result.output) {
      testCaseResults.push({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: result.error,
        passed: false,
        timeTaken,
      });
      continue;
    }

    // Compare output line by line (trimmed trailing whitespace and normalized line endings)
    const actual = normalizeOutput(result.output);
    const expected = normalizeOutput(tc.expectedOutput);
    const passed = actual === expected;

    if (passed) totalTestsPassed++;

    testCaseResults.push({
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      actualOutput: actual,
      passed,
      timeTaken,
    });
  }

  const totalTests = testCases.length;
  const allPassed = totalTestsPassed === totalTests && totalTests > 0;

  // Determine status
  let status;
  if (totalTests === 0) {
    status = 'accepted';
  } else if (testCaseResults.some(r => r.actualOutput === 'TLE')) {
    status = 'tle';
  } else if (testCaseResults.some(r => r.actualOutput && r.actualOutput.includes('Error') && !r.passed)) {
    status = allPassed ? 'accepted' : 'error';
  } else if (allPassed) {
    status = 'accepted';
  } else {
    status = 'wrong_answer';
  }

  // Calculate points
  let pointsEarned = 0;
  if (round === 3) {
    // Partial scoring: each test case has its own points value
    for (let i = 0; i < testCaseResults.length; i++) {
      if (testCaseResults[i].passed) {
        pointsEarned += (testCases[i].points || 0);
      }
    }
  } else {
    // All-or-nothing: full points only if all pass
    if (allPassed) {
      pointsEarned = question.totalPoints || 0;
    }
  }

  // Apply time bonus (if enabled and submission is in first half of round)
  if (question.timeBonusEnabled && inFirstHalf && pointsEarned > 0) {
    pointsEarned = Math.round(pointsEarned * (1 + TIME_BONUS_PERCENT / 100));
  }

  // Apply penalty per wrong submission
  if (question.penaltyPerWrongSubmission && wrongSubmissions > 0) {
    pointsEarned = Math.max(0, pointsEarned - question.penaltyPerWrongSubmission * wrongSubmissions);
  }

  return {
    testCaseResults,
    totalTestsPassed,
    totalTests,
    pointsEarned,
    status,
  };
}

module.exports = { evaluate };
