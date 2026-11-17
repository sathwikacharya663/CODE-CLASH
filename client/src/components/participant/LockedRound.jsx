import React from 'react'
import { Lock, ShieldAlert } from 'lucide-react'

export default function LockedRound({ round, roundName, message }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6">
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-2xl bg-volt-bg-secondary border border-volt-border flex items-center justify-center shadow-lg shadow-volt-green/5">
          <Lock className="w-12 h-12 text-volt-green animate-pulse" />
        </div>
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-volt-red animate-ping" />
      </div>

      <div className="inline-block px-3 py-1 mb-3 rounded-full bg-volt-bg-tertiary border border-volt-border text-volt-text-muted text-xs font-mono">
        STATUS: ACCESS RESTRICTED
      </div>

      <h2 className="text-3xl md:text-4xl font-mono font-bold text-volt-text mb-2">
        Round {round} <span className="text-volt-green font-normal">[{roundName || 'LOCKED'}]</span>
      </h2>

      <p className="text-volt-text-muted font-mono max-w-md text-sm md:text-base mb-6">
        {message || 'This round is currently locked. The server-controlled timer and question set will activate automatically when unlocked by the administrator.'}
      </p>

      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-volt-bg-secondary/60 border border-volt-border/60 text-volt-yellow font-mono text-xs">
        <span className="w-2 h-2 rounded-full bg-volt-yellow animate-ping" />
        <span>Waiting for admin to unlock in real time...</span>
      </div>
    </div>
  )
}
