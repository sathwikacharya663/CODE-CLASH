import { useEffect, useRef, useState } from 'react'
import { useSocket } from '../context/SocketContext.jsx'
import toast from 'react-hot-toast'

/**
 * Returns the tab-switch count for the current session.
 * Emits 'tab:switch' to the server via Socket.IO on each detection.
 */
export function useTabDetection(enabled = true) {
  const { socket } = useSocket()
  const hasWarnedRef = useRef(false)
  const [switchCount, setSwitchCount] = useState(0)

  useEffect(() => {
    if (!enabled) return

    const warn = () => {
      if (socket) socket.emit('tab:switch')
      setSwitchCount((c) => c + 1)
      toast('⚠ Tab switch detected!', {
        icon: '⚠️',
        style: {
          background: '#21262d',
          color: '#ffd60a',
          border: '1px solid #ffd60a',
        },
        duration: 3000,
      })
    }

    const handleVisibilityChange = () => {
      if (document.hidden) warn()
    }

    const handleBlur = () => {
      if (!hasWarnedRef.current) {
        hasWarnedRef.current = true
        setTimeout(() => { hasWarnedRef.current = false }, 2000)
        warn()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleBlur)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleBlur)
    }
  }, [socket, enabled])

  return switchCount
}
