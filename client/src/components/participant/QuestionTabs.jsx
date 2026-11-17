import clsx from 'clsx'

export default function QuestionTabs({ questions, activeIndex, onSelect, submissions }) {
  const getStatus = (q) => {
    const sub = submissions?.find((s) => s.questionId === q._id && s.isFinalSubmission)
    if (sub) return 'submitted'
    const attempted = submissions?.find((s) => s.questionId === q._id)
    if (attempted) return 'attempted'
    return 'unattempted'
  }

  const dotColors = {
    unattempted: 'bg-volt-text-muted',
    attempted: 'bg-volt-yellow',
    submitted: 'bg-volt-green',
  }

  return (
    <div className="flex gap-1 p-2 bg-volt-bg-tertiary border-b border-volt-border">
      {questions.map((q, i) => {
        const status = getStatus(q)
        return (
          <button
            key={q._id}
            onClick={() => onSelect(i)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 font-mono text-sm rounded transition-all duration-200',
              activeIndex === i
                ? 'bg-volt-bg text-volt-green border border-volt-green volt-border-glow'
                : 'text-volt-text-muted hover:text-volt-text hover:bg-volt-bg'
            )}
          >
            <span
              className={clsx(
                'w-2 h-2 rounded-full',
                dotColors[status],
                status === 'submitted' && 'shadow-[0_0_6px_#39ff14]'
              )}
            />
            Q{i + 1}
          </button>
        )
      })}
    </div>
  )
}
