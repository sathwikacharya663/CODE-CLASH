import React, { useState } from 'react'
import {
  Play,
  Pause,
  Square,
  PlusCircle,
  Lock,
  Unlock,
  CheckCircle2,
  Users,
  AlertCircle,
  RotateCcw,
} from 'lucide-react'
import toast from 'react-hot-toast'
import CountdownTimer from '../common/CountdownTimer.jsx'

export default function RoundControl({
  rounds = {},
  timerMs = 0,
  onUnlock,
  onPause,
  onResume,
  onEnd,
  onExtend,
  onResetRound,
  onResetAllRounds,
  onOpenTop10Modal,
  loading = false,
}) {
  const [extendingRound, setExtendingRound] = useState(null)

  const roundDetails = [
    {
      num: 1,
      title: 'Round 1: Code Replication',
      defaultMinutes: 30,
      description: 'Replicate exact console pattern and output matching given constraints.',
    },
    {
      num: 2,
      title: 'Round 2: Code Debugging',
      defaultMinutes: 30,
      description: 'Find and fix logic bugs in pre-loaded starter code across 4 languages.',
    },
    {
      num: 3,
      title: 'Round 3: Coding from Scratch',
      defaultMinutes: 60,
      description: 'Top 10 teams only. Complex algorithmic problems with partial test case scoring.',
    },
  ]

  const handleExtend = async (roundNum) => {
    try {
      setExtendingRound(roundNum)
      await onExtend(roundNum, 5)
      toast.success(`Extended Round ${roundNum} by +5 minutes`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to extend round')
    } finally {
      setExtendingRound(null)
    }
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-mono text-2xl font-bold text-volt-text">Round &amp; Timer Control</h2>
          <p className="text-volt-text-muted font-mono text-xs mt-1">
            Server-side authoritative round sequencing, timer broadcasts, and qualification gates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Reset All Rounds button */}
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Are you sure you want to RESET the entire competition? This will lock all rounds, clear timers, and reset all submissions so you can test again from scratch.')) {
                onResetAllRounds && onResetAllRounds();
              }
            }}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg font-mono text-xs font-semibold bg-volt-red/10 border border-volt-red/40 text-volt-red hover:bg-volt-red/20 transition-all shadow-[0_0_10px_rgba(255,69,58,0.15)] disabled:opacity-50"
            title="Reset all rounds, timers, and submissions"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Entire Competition</span>
          </button>

          {/* Top 10 Qualifier trigger button */}
          <button
            type="button"
            onClick={onOpenTop10Modal}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-semibold bg-volt-purple/10 border border-volt-purple/40 text-volt-purple hover:bg-volt-purple/20 transition-all shadow-[0_0_12px_rgba(191,90,242,0.15)]"
          >
            <Users className="w-4 h-4" />
            <span>Manage Round 3 Qualifiers (Top 10)</span>
          </button>
        </div>
      </div>

      {/* Round Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {roundDetails.map((rd) => {
          const state = rounds[rd.num] || { round: rd.num, status: 'locked', durationMinutes: rd.defaultMinutes }
          const isActive = state.status === 'active'
          const isPaused = state.status === 'paused'
          const isEnded = state.status === 'ended'
          const isLocked = state.status === 'locked' || (!isActive && !isPaused && !isEnded)

          // Enforce sequential unlocking
          const canUnlock =
            (rd.num === 1 && !isActive && !isPaused && !isEnded) ||
            (rd.num === 2 && rounds[1]?.status === 'ended' && !isActive && !isPaused && !isEnded) ||
            (rd.num === 3 && rounds[2]?.status === 'ended' && !isActive && !isPaused && !isEnded)

          return (
            <div
              key={rd.num}
              className={`rounded-xl border p-5 flex flex-col justify-between transition-all duration-200 bg-volt-bg-secondary ${
                isActive
                  ? 'border-volt-green/50 shadow-[0_0_20px_rgba(57,255,20,0.15)] ring-1 ring-volt-green/30'
                  : isPaused
                  ? 'border-volt-yellow/40 bg-volt-bg-secondary/90'
                  : isEnded
                  ? 'border-volt-border opacity-70'
                  : 'border-volt-border'
              }`}
            >
              <div>
                {/* Status Badge & Header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs text-volt-text-muted uppercase tracking-wider">
                    {rd.defaultMinutes} Minutes
                  </span>

                  {isActive && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-volt-green/10 text-volt-green border border-volt-green/40 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-volt-green" />
                      ACTIVE
                    </span>
                  )}
                  {isPaused && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-volt-yellow/10 text-volt-yellow border border-volt-yellow/40">
                      PAUSED
                    </span>
                  )}
                  {isEnded && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono bg-volt-bg-tertiary text-volt-text-muted border border-volt-border">
                      <CheckCircle2 className="w-3.5 h-3.5 text-volt-cyan" />
                      ENDED
                    </span>
                  )}
                  {isLocked && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono bg-volt-bg-tertiary text-volt-text-muted border border-volt-border">
                      <Lock className="w-3.5 h-3.5" />
                      LOCKED
                    </span>
                  )}
                </div>

                <h3 className="font-mono text-lg font-bold text-volt-text mb-1">{rd.title}</h3>
                <p className="font-mono text-xs text-volt-text-muted leading-relaxed mb-4">
                  {rd.description}
                </p>

                {/* Live Countdown Display */}
                <div className="bg-volt-bg p-3 rounded-lg border border-volt-border mb-4 flex items-center justify-between">
                  <span className="font-mono text-xs text-volt-text-muted">Remaining Time:</span>
                  {isActive || isPaused ? (
                    <CountdownTimer remainingMs={timerMs} isPaused={isPaused} />
                  ) : (
                    <span className="font-mono text-sm text-volt-text-muted">
                      {isEnded ? '00:00 (Completed)' : `${rd.defaultMinutes}:00`}
                    </span>
                  )}
                </div>

                {/* Qualification Warning for Round 3 */}
                {rd.num === 3 && (
                  <div className="mb-4 p-2.5 rounded bg-volt-purple/10 border border-volt-purple/30 text-volt-purple font-mono text-[11px] flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      Restricted to Top 10 Teams. Use the Qualifier button above to confirm selected teams before starting.
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-3 border-t border-volt-border">
                {isLocked && (
                  <button
                    type="button"
                    onClick={() => onUnlock(rd.num)}
                    disabled={!canUnlock || loading}
                    className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-mono text-xs font-bold transition-all ${
                      canUnlock
                        ? 'bg-volt-green text-volt-bg hover:bg-volt-green/90 shadow-[0_0_12px_rgba(57,255,20,0.3)]'
                        : 'bg-volt-bg-tertiary text-volt-text-muted cursor-not-allowed border border-volt-border'
                    }`}
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>{canUnlock ? `Unlock & Start Round ${rd.num}` : 'Waiting for Previous Round'}</span>
                  </button>
                )}

                {isActive && (
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => onPause(rd.num)}
                      disabled={loading}
                      className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg font-mono text-xs bg-volt-yellow/10 border border-volt-yellow/40 text-volt-yellow hover:bg-volt-yellow/20"
                      title="Pause Timer"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExtend(rd.num)}
                      disabled={loading || extendingRound === rd.num}
                      className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg font-mono text-xs bg-volt-cyan/10 border border-volt-cyan/40 text-volt-cyan hover:bg-volt-cyan/20"
                      title="Add 5 Minutes"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>+5 Min</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to end Round ${rd.num}? This will auto-submit remaining code.`)) {
                          onEnd(rd.num)
                        }
                      }}
                      disabled={loading}
                      className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg font-mono text-xs bg-volt-red/10 border border-volt-red/40 text-volt-red hover:bg-volt-red/20"
                      title="End Round & Auto-Submit"
                    >
                      <Square className="w-3.5 h-3.5" />
                      <span>End</span>
                    </button>
                  </div>
                )}

                {isPaused && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onResume(rd.num)}
                      disabled={loading}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-mono text-xs bg-volt-green text-volt-bg font-bold hover:bg-volt-green/90"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Resume</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onEnd(rd.num)}
                      disabled={loading}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-mono text-xs bg-volt-red/10 border border-volt-red/40 text-volt-red hover:bg-volt-red/20"
                    >
                      <Square className="w-3.5 h-3.5" />
                      <span>End Round</span>
                    </button>
                  </div>
                )}

                {isEnded && (
                  <div className="space-y-2">
                    <div className="text-center py-1 text-xs font-mono text-volt-text-muted italic">
                      Round concluded. Results calculated.
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Reset Round ${rd.num} back to locked state?`)) {
                          onResetRound && onResetRound(rd.num);
                        }
                      }}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg font-mono text-xs bg-volt-bg-tertiary border border-volt-border text-volt-cyan hover:border-volt-cyan hover:bg-volt-cyan/10 transition-colors disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Round {rd.num} to Locked</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
