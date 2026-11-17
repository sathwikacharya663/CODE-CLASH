import { useState, useEffect, useCallback } from 'react'
import { useSocket } from '../context/SocketContext.jsx'

export function useTimer(initialMs = 0) {
  const { socket } = useSocket()
  const [remainingMs, setRemainingMs] = useState(initialMs)

  useEffect(() => {
    if (!socket) return
    const handler = (data) => setRemainingMs(data.remainingMs)
    socket.on('timer:tick', handler)
    return () => socket.off('timer:tick', handler)
  }, [socket])

  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const isLast5Minutes = remainingMs > 0 && remainingMs <= 5 * 60 * 1000
  const isExpired = remainingMs <= 0

  const format = useCallback(() => {
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }, [minutes, seconds])

  return { minutes, seconds, remainingMs, isLast5Minutes, isExpired, format }
}
