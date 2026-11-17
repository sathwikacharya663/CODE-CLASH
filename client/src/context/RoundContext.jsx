import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useSocket } from './SocketContext.jsx'
import { getRoundStates } from '../api/admin.js'

const RoundContext = createContext(null)

export function RoundProvider({ children }) {
  const { socket } = useSocket()
  const [rounds, setRounds] = useState({ 1: null, 2: null, 3: null })
  const [activeRound, setActiveRound] = useState(null)
  const [timerMs, setTimerMs] = useState(0)

  const fetchRoundStates = useCallback(async () => {
    try {
      const res = await getRoundStates()
      const roundMap = {}
      res.data.rounds.forEach((r) => { roundMap[r.round] = r })
      setRounds(roundMap)
      const active = res.data.rounds.find((r) => r.status === 'active')
      setActiveRound(active || null)
    } catch {}
  }, [])

  useEffect(() => {
    fetchRoundStates()
  }, [fetchRoundStates])

  useEffect(() => {
    if (!socket) return

    socket.on('round:unlocked', (data) => {
      setRounds((prev) => ({ ...prev, [data.round]: data }))
      setActiveRound(data)
      fetchRoundStates()
    })

    socket.on('round:paused', (data) => {
      setRounds((prev) => ({ ...prev, [data.round]: data }))
      if (activeRound?.round === data.round) setActiveRound(data)
    })

    socket.on('round:resumed', (data) => {
      setRounds((prev) => ({ ...prev, [data.round]: data }))
      if (activeRound?.round === data.round) setActiveRound(data)
    })

    socket.on('round:ended', (data) => {
      setRounds((prev) => ({ ...prev, [data.round]: { ...prev[data.round], status: 'ended' } }))
      if (activeRound?.round === data.round) setActiveRound(null)
    })

    socket.on('round:reset', () => {
      fetchRoundStates()
      setActiveRound(null)
      setTimerMs(0)
    })

    socket.on('timer:tick', (data) => {
      setTimerMs(data.remainingMs)
    })

    return () => {
      socket.off('round:unlocked')
      socket.off('round:paused')
      socket.off('round:resumed')
      socket.off('round:ended')
      socket.off('timer:tick')
    }
  }, [socket, activeRound, fetchRoundStates])

  return (
    <RoundContext.Provider value={{ rounds, activeRound, timerMs, fetchRoundStates }}>
      {children}
    </RoundContext.Provider>
  )
}

export function useRound() {
  const ctx = useContext(RoundContext)
  if (!ctx) throw new Error('useRound must be used within RoundProvider')
  return ctx
}
