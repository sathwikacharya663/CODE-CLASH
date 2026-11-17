import clsx from 'clsx'

/**
 * CountdownTimer
 * - If `remainingMs` prop is provided, use it directly (admin/participant layout usage).
 * - `isPaused` tints the timer yellow instead of green/red.
 */
export default function CountdownTimer({ remainingMs = 0, isPaused = false, className }) {
  const ms = Math.max(0, remainingMs)
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const isLast5Minutes = ms > 0 && ms <= 5 * 60 * 1000
  const isExpired = ms <= 0

  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return (
    <div
      className={clsx(
        'font-mono text-lg font-bold px-3 py-1 rounded border transition-all duration-500',
        {
          'text-volt-yellow border-volt-yellow': isPaused,
          'text-volt-green border-volt-green volt-border-glow': !isPaused && !isLast5Minutes && !isExpired,
          'text-volt-red border-volt-red animate-pulse shadow-[0_0_15px_rgba(255,69,58,0.4)]':
            !isPaused && isLast5Minutes && !isExpired,
          'text-volt-text-muted border-volt-border': isExpired,
        },
        className
      )}
    >
      {isExpired ? '00:00' : formatted}
    </div>
  )
}
