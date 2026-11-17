import clsx from 'clsx'

const LANGS = [
  { value: 'python', label: 'Python 3' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'java', label: 'Java' },
]

export default function LanguageSelector({ value, onChange, disabled }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-volt-text-muted font-mono text-xs uppercase tracking-wider">Lang:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="bg-volt-bg-tertiary border border-volt-border text-volt-text font-mono text-sm px-3 py-1.5 rounded focus:outline-none focus:border-volt-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {LANGS.map((l) => (
          <option key={l.value} value={l.value}>
            {l.label}
          </option>
        ))}
      </select>
    </div>
  )
}
