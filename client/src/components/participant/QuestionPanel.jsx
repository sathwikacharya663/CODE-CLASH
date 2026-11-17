export default function QuestionPanel({ question, round }) {
  if (!question) {
    return (
      <div className="flex items-center justify-center h-full text-volt-text-muted font-mono">
        Select a question
      </div>
    )
  }

  return (
    <div className="p-4 overflow-y-auto h-full font-mono text-sm">
      {/* Title */}
      <h2 className="text-volt-text font-bold text-lg mb-1">{question.title}</h2>
      <div className="flex gap-2 mb-4">
        <span className="text-xs text-volt-green border border-volt-green px-2 py-0.5 rounded">
          Round {round}
        </span>
        <span className="text-xs text-volt-text-muted border border-volt-border px-2 py-0.5 rounded">
          {question.totalPoints} pts
        </span>
      </div>

      {/* Description */}
      <section className="mb-4">
        <h3 className="text-volt-green text-xs uppercase tracking-wider mb-2">Problem Statement</h3>
        <p className="text-volt-text leading-relaxed whitespace-pre-wrap">{question.description}</p>
      </section>

      {/* Input Format */}
      {question.inputFormat && (
        <section className="mb-4">
          <h3 className="text-volt-cyan text-xs uppercase tracking-wider mb-2">Input Format</h3>
          <p className="text-volt-text leading-relaxed">{question.inputFormat}</p>
        </section>
      )}

      {/* Output Format */}
      {question.outputFormat && (
        <section className="mb-4">
          <h3 className="text-volt-cyan text-xs uppercase tracking-wider mb-2">Output Format</h3>
          <p className="text-volt-text leading-relaxed">{question.outputFormat}</p>
        </section>
      )}

      {/* Constraints */}
      {question.constraints && (
        <section className="mb-4">
          <h3 className="text-volt-yellow text-xs uppercase tracking-wider mb-2">Constraints</h3>
          <p className="text-volt-text leading-relaxed">{question.constraints}</p>
        </section>
      )}

      {/* Sample Input/Output */}
      {question.sampleInput && (
        <section className="mb-4">
          <h3 className="text-volt-text-muted text-xs uppercase tracking-wider mb-2">Sample Input</h3>
          <pre className="bg-volt-bg-tertiary border border-volt-border rounded p-3 text-volt-text overflow-x-auto text-xs">
            {question.sampleInput}
          </pre>
        </section>
      )}

      {question.sampleOutput && (
        <section className="mb-4">
          <h3 className="text-volt-text-muted text-xs uppercase tracking-wider mb-2">Sample Output</h3>
          <pre className="bg-volt-bg-tertiary border border-volt-border rounded p-3 text-volt-text overflow-x-auto text-xs">
            {question.sampleOutput}
          </pre>
        </section>
      )}

      {/* Round 1 expected output */}
      {round === 1 && question.expectedOutput && (
        <section className="mb-4">
          <h3 className="text-volt-green text-xs uppercase tracking-wider mb-2">Expected Output Pattern</h3>
          <pre className="bg-volt-bg border border-volt-green rounded p-3 text-volt-green overflow-x-auto text-xs volt-border-glow">
            {question.expectedOutput}
          </pre>
        </section>
      )}

      {/* Round 2 emphasis */}
      {round === 2 && (
        <div className="mt-4 p-3 bg-volt-yellow/10 border border-volt-yellow rounded">
          <p className="text-volt-yellow text-xs font-semibold">
            ⚠ Debug Mode: The editor is pre-loaded with buggy code. Find and fix all bugs!
          </p>
        </div>
      )}
    </div>
  )
}
