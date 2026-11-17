import React, { useState } from 'react'
import { Terminal, AlertTriangle, FileCode, CheckCircle2 } from 'lucide-react'

export default function ConsolePanel({
  output = '',
  error = '',
  customInput = '',
  setCustomInput,
  isRunning = false,
  submissionStatus = null,
}) {
  const [activeTab, setActiveTab] = useState('output')

  return (
    <div className="flex flex-col h-full bg-volt-bg-secondary border-t border-volt-border font-mono text-xs select-none">
      {/* Console Tab Headers */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-volt-bg border-b border-volt-border">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('output')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors ${
              activeTab === 'output'
                ? 'bg-volt-bg-tertiary text-volt-green border border-volt-border'
                : 'text-volt-text-muted hover:text-volt-text'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Output</span>
            {output && <span className="w-1.5 h-1.5 rounded-full bg-volt-green" />}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('errors')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors ${
              activeTab === 'errors'
                ? 'bg-volt-bg-tertiary text-volt-red border border-volt-border'
                : 'text-volt-text-muted hover:text-volt-text'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Errors</span>
            {error && <span className="w-1.5 h-1.5 rounded-full bg-volt-red animate-ping" />}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('custom-input')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors ${
              activeTab === 'custom-input'
                ? 'bg-volt-bg-tertiary text-volt-cyan border border-volt-border'
                : 'text-volt-text-muted hover:text-volt-text'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Custom Input</span>
          </button>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-2">
          {isRunning && (
            <div className="flex items-center gap-1.5 text-volt-yellow font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-volt-yellow animate-ping" />
              <span>Executing via Piston...</span>
            </div>
          )}

          {submissionStatus && (
            <div className="flex items-center gap-1 text-volt-green font-mono text-[11px] bg-volt-green/10 px-2 py-0.5 rounded border border-volt-green/30">
              <CheckCircle2 className="w-3 h-3" />
              <span>{submissionStatus}</span>
            </div>
          )}
        </div>
      </div>

      {/* Console Tab Content */}
      <div className="flex-1 p-3 overflow-y-auto min-h-[140px] max-h-[220px]">
        {activeTab === 'output' && (
          <div>
            {output ? (
              <pre className="text-volt-green whitespace-pre-wrap font-mono text-xs leading-relaxed selection:bg-volt-green selection:text-volt-bg">
                {output}
              </pre>
            ) : (
              <div className="text-volt-text-muted italic flex items-center gap-2">
                <span>Console ready. Press "Run" to test with custom/sample input.</span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'errors' && (
          <div>
            {error ? (
              <pre className="text-volt-red whitespace-pre-wrap font-mono text-xs leading-relaxed selection:bg-volt-red selection:text-volt-bg">
                {error}
              </pre>
            ) : (
              <div className="text-volt-text-muted italic">
                No compilation or runtime errors reported.
              </div>
            )}
          </div>
        )}

        {activeTab === 'custom-input' && (
          <div className="flex flex-col h-full">
            <label className="text-[11px] text-volt-text-muted mb-1 block">
              Enter custom standard input (stdin) passed to your program when clicking "Run":
            </label>
            <textarea
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="e.g. 5"
              className="w-full h-24 p-2 bg-volt-bg border border-volt-border rounded text-volt-text font-mono text-xs focus:outline-none focus:border-volt-cyan resize-none"
            />
          </div>
        )}
      </div>
    </div>
  )
}
