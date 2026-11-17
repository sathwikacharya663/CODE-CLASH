import React from 'react'
import { Zap, LogOut, AlertTriangle, ShieldCheck } from 'lucide-react'
import CountdownTimer from '../common/CountdownTimer.jsx'

export default function ParticipantLayout({
  teamName,
  teamId,
  currentRound,
  roundStatus,
  remainingMs,
  tabSwitchCount = 0,
  isAutoSaving = false,
  onLogout,
  children,
}) {
  const getRoundLabel = (r) => {
    switch (r) {
      case 1:
        return 'Round 1: Code Replication'
      case 2:
        return 'Round 2: Code Debugging'
      case 3:
        return 'Round 3: Coding from Scratch'
      default:
        return `Round ${r || 1}`
    }
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-volt-bg text-volt-text overflow-hidden font-sans">
      {/* Top Participant Navigation Bar */}
      <header className="h-14 border-b border-volt-border bg-volt-bg-secondary px-4 flex items-center justify-between shrink-0 select-none z-20">
        {/* Brand & Round Tag */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-volt-green animate-pulse" />
            <span className="font-mono font-bold text-lg text-volt-green tracking-wide">
              CODE VOLT
            </span>
          </div>

          <span className="hidden sm:inline-block text-volt-border">|</span>

          <div className="hidden sm:flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-mono bg-volt-bg-tertiary border border-volt-border text-volt-cyan">
              {getRoundLabel(currentRound)}
            </span>
            {roundStatus === 'active' && (
              <span className="flex items-center gap-1 text-[11px] font-mono text-volt-green">
                <span className="w-2 h-2 rounded-full bg-volt-green animate-ping" />
                LIVE
              </span>
            )}
            {roundStatus === 'paused' && (
              <span className="flex items-center gap-1 text-[11px] font-mono text-volt-yellow">
                <span className="w-2 h-2 rounded-full bg-volt-yellow" />
                PAUSED
              </span>
            )}
          </div>
        </div>

        {/* Center: Live Server Countdown Timer */}
        <div className="flex items-center gap-3">
          {roundStatus === 'active' || roundStatus === 'paused' ? (
            <div className="flex items-center gap-2 bg-volt-bg px-3 py-1 rounded-lg border border-volt-border shadow-inner">
              <span className="text-[11px] font-mono text-volt-text-muted uppercase">Timer:</span>
              <CountdownTimer remainingMs={remainingMs} isPaused={roundStatus === 'paused'} />
            </div>
          ) : (
            <div className="text-xs font-mono text-volt-text-muted px-3 py-1 rounded bg-volt-bg-tertiary border border-volt-border">
              Timer: Inactive
            </div>
          )}
        </div>

        {/* Right Info: Auto-save status, Tab alerts, Team info & Logout */}
        <div className="flex items-center gap-3">
          {isAutoSaving && (
            <span className="hidden md:inline-block text-[11px] font-mono text-volt-green animate-pulse">
              ● Auto-saved
            </span>
          )}

          {tabSwitchCount > 0 && (
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-volt-red/10 border border-volt-red/30 text-volt-red text-xs font-mono"
              title="Window blur / Tab switches detected by proctoring system"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{tabSwitchCount} switch{tabSwitchCount > 1 ? 'es' : ''}</span>
            </div>
          )}

          <div className="hidden md:flex flex-col items-end text-right font-mono">
            <span className="text-xs text-volt-text font-semibold">{teamName || 'Team'}</span>
            <span className="text-[10px] text-volt-text-muted">{teamId}</span>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono rounded bg-volt-bg-tertiary border border-volt-border text-volt-text-muted hover:text-volt-red hover:border-volt-red/50 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        {children}
      </main>
    </div>
  )
}
