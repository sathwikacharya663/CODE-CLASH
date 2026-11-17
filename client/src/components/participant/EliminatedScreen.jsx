import React from 'react'
import { ShieldX, Trophy } from 'lucide-react'

export default function EliminatedScreen({ teamName }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6">
      <div className="w-24 h-24 rounded-2xl bg-volt-bg-secondary border border-volt-red/40 flex items-center justify-center mb-6 shadow-xl shadow-volt-red/10">
        <ShieldX className="w-12 h-12 text-volt-red animate-pulse" />
      </div>

      <div className="inline-block px-3 py-1 mb-3 rounded-full bg-volt-red/10 border border-volt-red/30 text-volt-red text-xs font-mono font-semibold">
        ROUND 3 QUALIFICATION STATUS: ELIMINATED
      </div>

      <h2 className="text-3xl md:text-4xl font-mono font-bold text-volt-text mb-3">
        Thank You for Participating, <span className="text-volt-cyan">{teamName || 'Team'}</span>!
      </h2>

      <p className="text-volt-text-muted font-mono max-w-lg text-sm md:text-base mb-6 leading-relaxed">
        Round 3 (Coding from Scratch) is reserved exclusively for the top 10 scoring teams from Rounds 1 &amp; 2.
        Your participation and effort throughout the competition are greatly appreciated.
      </p>

      <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-volt-bg-secondary border border-volt-border text-volt-text-muted text-xs font-mono">
        <Trophy className="w-4 h-4 text-volt-yellow" />
        <span>Stay tuned for the final leaderboard and prize distribution announcement!</span>
      </div>
    </div>
  )
}
