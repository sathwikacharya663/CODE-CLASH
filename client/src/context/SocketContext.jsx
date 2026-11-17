import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext.jsx'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const { user } = useAuth()
  const socketRef = useRef(null)
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const sock = io('/', {
      auth: { token: localStorage.getItem('token') },
      transports: ['websocket', 'polling'],
    })

    sock.on('connect', () => {
      setConnected(true)
      if (user?.role === 'admin') {
        sock.emit('join:admin')
      } else if (user?.teamId) {
        sock.emit('join:team', { teamId: user.teamId })
      }
    })

    sock.on('disconnect', () => {
      setConnected(false)
    })

    socketRef.current = sock
    setSocket(sock)

    return () => {
      sock.disconnect()
    }
  }, [user?.teamId, user?.role])

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const ctx = useContext(SocketContext)
  if (!ctx) throw new Error('useSocket must be used within SocketProvider')
  return ctx
}
