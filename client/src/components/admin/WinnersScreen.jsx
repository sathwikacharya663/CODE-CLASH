import React, { useState, useEffect } from 'react'
import { Trophy, Star, Award, Sparkles, X } from 'lucide-react'

export default function WinnersScreen({ isOpen, onClose, winnersData }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setShow(true), 100)
    } else {
      setShow(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const first = winnersData?.firstPlace
  const second = winnersData?.secondPlace
  const prizePool = winnersData?.prizePool || 'Rs. 4,000'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />

      {/* Confetti particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-sm animate-bounce opacity-70"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: ['#39ff14', '#00f5ff', '#bf5af2', '#ffd60a', '#ff453a'][i % 5],
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Main card */}
      <div
        className={`relative z-10 w-full max-w-3xl mx-4 bg-volt-bg-secondary border-2 border-volt-yellow rounded-2xl shadow-[0_0_60px_rgba(255,214,10,0.4)] transition-all duration-700 ${
          show ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-volt-bg-tertiary text-volt-text-muted hover:text-volt-red transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center pt-10 pb-6 px-8 border-b border-volt-border/50">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Sparkles className="w-8 h-8 text-volt-yellow fill-current animate-spin" style={{ animationDuration: '3s' }} />
            <h1 className="font-mono text-4xl md:text-5xl font-black text-volt-green glow-green-intense tracking-tight">
              ⚡ CODE CLASH
            </h1>
            <Sparkles className="w-8 h-8 text-volt-yellow fill-current animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }} />
          </div>
          <p className="font-mono text-volt-text-muted text-lg">Competition Results — Prize Pool: <span className="text-volt-yellow font-bold">{prizePool}</span></p>
        </div>

        {/* Winners */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1st Place */}
          {first && (
            <div className="relative p-6 rounded-2xl bg-gradient-to-br from-volt-yellow/20 to-volt-green/10 border-2 border-volt-yellow shadow-[0_0_30px_rgba(255,214,10,0.3)] text-center">
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-volt-yellow flex items-center justify-center shadow-[0_0_20px_#ffd60a]">
                <span className="font-mono font-black text-volt-bg text-lg">1</span>
              </div>

              <Trophy className="w-12 h-12 text-volt-yellow mx-auto mb-3 mt-2 drop-shadow-[0_0_12px_#ffd60a]" />

              <div className="font-mono text-xs text-volt-yellow uppercase tracking-widest font-bold mb-2">
                🥇 First Place
              </div>
              <h2 className="font-mono text-2xl font-black text-volt-text mb-1">{first.teamName}</h2>
              <p className="font-mono text-xs text-volt-text-muted mb-3">
                {Array.isArray(first.members) ? first.members.join(' · ') : ''}
              </p>
              <div className="inline-block px-4 py-2 rounded-xl bg-volt-yellow/20 border border-volt-yellow font-mono font-black text-volt-yellow text-2xl shadow-inner">
                {first.prize}
              </div>
              <div className="mt-2 font-mono text-xs text-volt-green">
                Total Score: <span className="font-bold">{first.totalScore} pts</span>
              </div>
            </div>
          )}

          {/* 2nd Place */}
          {second && (
            <div className="relative p-6 rounded-2xl bg-gradient-to-br from-volt-cyan/20 to-volt-purple/10 border-2 border-volt-cyan shadow-[0_0_20px_rgba(0,245,255,0.2)] text-center">
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-volt-cyan flex items-center justify-center shadow-[0_0_20px_#00f5ff]">
                <span className="font-mono font-black text-volt-bg text-lg">2</span>
              </div>

              <Award className="w-12 h-12 text-volt-cyan mx-auto mb-3 mt-2 drop-shadow-[0_0_12px_#00f5ff]" />

              <div className="font-mono text-xs text-volt-cyan uppercase tracking-widest font-bold mb-2">
                🥈 Second Place
              </div>
              <h2 className="font-mono text-2xl font-black text-volt-text mb-1">{second.teamName}</h2>
              <p className="font-mono text-xs text-volt-text-muted mb-3">
                {Array.isArray(second.members) ? second.members.join(' · ') : ''}
              </p>
              <div className="inline-block px-4 py-2 rounded-xl bg-volt-cyan/20 border border-volt-cyan font-mono font-black text-volt-cyan text-2xl shadow-inner">
                {second.prize}
              </div>
              <div className="mt-2 font-mono text-xs text-volt-green">
                Total Score: <span className="font-bold">{second.totalScore} pts</span>
              </div>
            </div>
          )}
        </div>

        <div className="text-center pb-8 font-mono text-sm text-volt-text-muted">
          Congratulations to all 30 teams for participating in <span className="text-volt-green font-bold">CODE CLASH</span>! ⚡
        </div>
      </div>
    </div>
  )
}
