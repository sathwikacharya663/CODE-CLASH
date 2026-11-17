import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { login as loginApi } from '../api/auth.js'
import { Zap, Terminal, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [teamId, setTeamId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [loginType, setLoginType] = useState('participant')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const res = await loginApi({ teamId: teamId.trim().toUpperCase(), password })
      const { user, token } = res.data
      login(user, token)
      toast.success(`Welcome, ${user.teamName || user.teamId}!`)
      if (user.role === 'admin') navigate('/admin')
      else navigate('/participant')
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid credentials'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-volt-bg flex items-center justify-center px-4">
      {/* Background grid */}
      <div
        className="fixed inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(57,255,20,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(57,255,20,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Terminal header */}
        <div className="bg-volt-bg-tertiary border border-volt-border rounded-t-lg px-4 py-2 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-volt-red" />
          <div className="w-3 h-3 rounded-full bg-volt-yellow" />
          <div className="w-3 h-3 rounded-full bg-volt-green" />
          <span className="ml-2 text-volt-text-muted font-mono text-xs">code-volt-auth.sh</span>
        </div>

        {/* Card */}
        <div className="bg-volt-bg-secondary border border-volt-border border-t-0 rounded-b-lg p-8 volt-border-glow">
          {/* Title */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Terminal size={20} className="text-volt-green" />
              <span className="font-mono text-volt-green text-sm">{'>'} CODE VOLT LOGIN SYSTEM</span>
            </div>
            <h1 className="font-mono font-black text-3xl glow-green" style={{ color: '#39ff14' }}>
              ⚡ CODE VOLT
            </h1>
            <p className="text-volt-text-muted text-sm mt-1 font-mono">Where Code Meets Competition</p>
          </div>

          {/* Login type toggle */}
          <div className="flex mb-6 bg-volt-bg-tertiary rounded-lg p-1">
            {['participant', 'admin'].map((type) => (
              <button
                key={type}
                onClick={() => setLoginType(type)}
                className={`flex-1 py-2 text-sm font-mono rounded-md transition-all duration-200 capitalize ${
                  loginType === type
                    ? 'bg-volt-green text-volt-bg font-semibold'
                    : 'text-volt-text-muted hover:text-volt-text'
                }`}
              >
                {type === 'participant' ? '👤 Participant' : '⚙ Admin'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Team ID */}
            <div>
              <label className="block text-volt-text-muted text-xs font-mono mb-1 uppercase tracking-wider">
                {loginType === 'admin' ? 'Admin ID' : 'Team ID'}
              </label>
              <input
                type="text"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                placeholder={loginType === 'admin' ? 'ADMIN' : 'TEAM001'}
                className="w-full bg-volt-bg border border-volt-border rounded px-4 py-3 font-mono text-volt-text placeholder-volt-text-muted focus:outline-none focus:border-volt-green focus:volt-border-glow transition-all"
                required
                autoFocus
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-volt-text-muted text-xs font-mono mb-1 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-volt-bg border border-volt-border rounded px-4 py-3 font-mono text-volt-text placeholder-volt-text-muted focus:outline-none focus:border-volt-green focus:volt-border-glow transition-all pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-volt-text-muted hover:text-volt-text"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-volt-red/10 border border-volt-red rounded px-4 py-2 font-mono text-volt-red text-sm">
                {'>'} Error: {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-neon-solid rounded py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-volt-bg border-t-transparent rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Zap size={18} />
                  Login
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-volt-text-muted font-mono text-xs">
            {'>'} Contact admin if you forgot your credentials
          </p>
        </div>
      </div>
    </div>
  )
}
