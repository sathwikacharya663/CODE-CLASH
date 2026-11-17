import { createContext, useContext, useState, useEffect } from 'react'
import { getMe } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token')
      if (storedToken) {
        try {
          const res = await getMe()
          setUser(res.data.user)
        } catch {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setUser(null)
        }
      }
      setIsLoading(false)
    }
    initAuth()
  }, [])

  const login = (userData, userToken) => {
    localStorage.setItem('token', userToken)
    localStorage.setItem('user', JSON.stringify(userData))
    setToken(userToken)
    setUser(userData)
  }

  const logout = async () => {
    try {
      const { logout: logoutApi } = await import('../api/auth')
      await logoutApi()
    } catch {}
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  const updateUser = (updates) => {
    setUser((prev) => ({ ...prev, ...updates }))
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
