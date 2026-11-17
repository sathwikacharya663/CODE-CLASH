import { Lock, Code2, Bug, Zap } from 'lucide-react'
import clsx from 'clsx'

const ROUND_INFO = {
  1: {
    icon: <Code2 size={24} />,
    name: 'Code Replication',
    description: 'Replicate the given output pattern exactly. Study the sample, understand the logic, and produce the matching result.',
    color: 'volt-green',
    borderColor: 'border-volt-green',
    textColor: 'text-volt-green',
    glowClass: 'volt-border-glow',
  },
  2: {
    icon: <Bug size={24} />,
    name: 'Debugging',
    description: 'Find and fix bugs in the provided broken code. Identify issues, correct the logic, and make all test cases pass.',
    color: 'volt-cyan',
    borderColor: 'border-volt-cyan',
    textColor: 'text-volt-cyan',
    glowClass: 'volt-border-glow-cyan',
  },
  3: {
    icon: <Zap size={24} />,
    name: 'Code from Scratch',
    description: 'Build complete solutions from scratch. Top 10 teams advance. Solve complex algorithmic problems under pressure.',
    color: 'volt-purple',
    borderColor: 'border-volt-purple',
    textColor: 'text-volt-purple',
    glowClass: 'volt-border-glow-purple',
  },
}

export default function RoundCard({ round, status = 'locked' }) {
  const info = ROUND_INFO[round]
  const isLocked = status === 'locked'
  const isActive = status === 'active'

  return (
    <div
      className={clsx(
        'relative bg-volt-bg-secondary border rounded-xl p-6 transition-all duration-300',
        info.borderColor,
        isActive ? info.glowClass : 'opacity-80 hover:opacity-100',
        isActive && 'scale-105'
      )}
      style={{ minWidth: '220px', maxWidth: '280px' }}
    >
      {isActive && (
        <div className="absolute -top-2 -right-2 bg-volt-green text-volt-bg text-xs font-mono font-bold px-2 py-0.5 rounded-full">
          LIVE
        </div>
      )}
      <div className={clsx('flex items-center gap-2 mb-3', info.textColor)}>
        {isLocked ? <Lock size={24} /> : info.icon}
        <span className="font-mono font-bold text-lg">Round {round}</span>
      </div>
      <h3 className={clsx('font-mono font-semibold text-base mb-2', info.textColor)}>
        {info.name}
      </h3>
      <p className="text-volt-text-muted text-sm leading-relaxed">{info.description}</p>
      <div className="mt-4 flex items-center gap-2">
        <span
          className={clsx(
            'text-xs font-mono px-2 py-0.5 rounded-full border',
            isLocked
              ? 'border-volt-border text-volt-text-muted'
              : isActive
              ? `${info.borderColor} ${info.textColor}`
              : 'border-volt-border text-volt-text-muted'
          )}
        >
          {isLocked ? '🔒 Locked' : isActive ? '⚡ Active' : '✓ Ended'}
        </span>
      </div>
    </div>
  )
}
