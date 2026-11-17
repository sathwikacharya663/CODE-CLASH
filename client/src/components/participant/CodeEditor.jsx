import React, { useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'

export default function CodeEditor({
  code,
  onChange,
  language = 'python',
  readOnly = false,
  copyPasteDisabled = false,
}) {
  const editorRef = useRef(null)

  // Map our language names to Monaco editor language identifiers
  const getMonacoLanguage = (lang) => {
    switch (lang?.toLowerCase()) {
      case 'c':
        return 'c'
      case 'cpp':
        return 'cpp'
      case 'java':
        return 'java'
      case 'python':
      default:
        return 'python'
    }
  }

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor

    // Apply custom Monaco editor styling overrides if desired
    monaco.editor.defineTheme('volt-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6a737d', fontStyle: 'italic' },
        { token: 'keyword', foreground: '00f5ff' },
        { token: 'string', foreground: '39ff14' },
        { token: 'number', foreground: 'ffd60a' },
      ],
      colors: {
        'editor.background': '#0d1117',
        'editor.foreground': '#e6edf3',
        'editorLineNumber.foreground': '#484f58',
        'editorLineNumber.activeForeground': '#39ff14',
        'editor.lineHighlightBackground': '#161b22',
        'editorCursor.foreground': '#39ff14',
      },
    })
    monaco.editor.setTheme('volt-dark')

    if (copyPasteDisabled) {
      editor.onKeyDown((e) => {
        // Prevent Ctrl+C, Ctrl+V, Cmd+C, Cmd+V
        if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyC' || e.code === 'KeyV')) {
          e.preventDefault()
          e.stopPropagation()
        }
      })
    }
  }

  return (
    <div className="relative w-full h-full min-h-[350px] bg-volt-bg overflow-hidden flex flex-col">
      {readOnly && (
        <div className="absolute top-2 right-4 z-10 px-2 py-0.5 rounded bg-volt-red/20 border border-volt-red/40 text-volt-red text-[11px] font-mono flex items-center gap-1.5 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-volt-red animate-ping" />
          READ-ONLY (TIME UP / LOCKED)
        </div>
      )}

      <div className="flex-1 w-full h-full">
        <Editor
          height="100%"
          language={getMonacoLanguage(language)}
          value={code}
          onChange={(val) => onChange(val || '')}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 14,
            lineHeight: 22,
            minimap: { enabled: false },
            wordWrap: 'on',
            automaticLayout: true,
            scrollBeyondLastLine: false,
            readOnly: readOnly,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            renderWhitespace: 'selection',
            tabSize: 4,
            bracketPairColorization: { enabled: true },
          }}
          loading={
            <div className="flex items-center justify-center h-full text-volt-green font-mono text-sm">
              <span className="animate-pulse">Loading Monaco Editor environment...</span>
            </div>
          }
        />
      </div>
    </div>
  )
}
