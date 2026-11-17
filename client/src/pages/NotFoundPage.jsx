import { Link } from 'react-router-dom'
import { Zap, Home } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-volt-bg flex items-center justify-center">
      <div className="text-center font-mono">
        <div className="text-volt-green text-8xl font-black mb-4 glow-green">404</div>
        <div className="text-volt-text-muted text-xl mb-2">{'>'} Page not found</div>
        <div className="text-volt-text-muted text-sm mb-8">
          The route you're looking for doesn't exist.
        </div>
        <Link
          to="/"
          className="btn-neon inline-flex items-center gap-2 rounded px-6 py-3"
        >
          <Home size={18} />
          Return to Base
        </Link>
      </div>
    </div>
  )
}
