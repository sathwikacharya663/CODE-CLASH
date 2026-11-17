import { useNavigate } from 'react-router-dom'
import CodeRain from '../components/landing/CodeRain.jsx'
import RoundCard from '../components/landing/RoundCard.jsx'
import BlinkingCursor from '../components/landing/BlinkingCursor.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { Zap } from 'lucide-react'

export default function LandingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleLogin = () => navigate('/login')
  const handleDashboard = () => {
    if (user?.role === 'admin') navigate('/admin')
    else navigate('/participant')
  }

  return (
    <div className="relative min-h-screen bg-volt-bg flex flex-col items-center justify-center overflow-hidden">
      <CodeRain />

      {/* Vignette overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-1"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 40%, rgba(13,17,23,0.8) 100%)',
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 py-16">
        {/* Logo */}
        <div className="mb-4 animate-float">
          <h1
            className="font-mono font-black text-6xl md:text-8xl glow-green-intense tracking-tight"
            style={{ color: '#39ff14' }}
          >
            ⚡ CODE VOLT
          </h1>
        </div>

        {/* Tagline */}
        <div className="flex items-center gap-1 mb-12 text-volt-text-muted font-mono text-xl md:text-2xl">
          <span>Where Code Meets Competition</span>
          <BlinkingCursor />
        </div>

        {/* Round Cards */}
        <div className="flex flex-col md:flex-row gap-6 mb-12 items-center justify-center">
          <RoundCard round={1} status="locked" />
          <RoundCard round={2} status="locked" />
          <RoundCard round={3} status="locked" />
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-4">
          {user ? (
            <button
              onClick={handleDashboard}
              className="btn-neon-solid flex items-center gap-2 text-lg px-8 py-3 rounded"
            >
              <Zap size={20} />
              Go to Dashboard
            </button>
          ) : (
            <button
              onClick={handleLogin}
              className="btn-neon flex items-center gap-2 text-lg px-8 py-3 rounded"
            >
              <Zap size={20} />
              Enter Competition
            </button>
          )}
        </div>

        {/* Footer tagline */}
        <p className="mt-16 text-volt-text-muted font-mono text-sm opacity-60">
          {'>'} Powered by competitive coding excellence
        </p>
      </div>
    </div>
  )
}
