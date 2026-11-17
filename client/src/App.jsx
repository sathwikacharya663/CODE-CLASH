import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { SocketProvider } from './context/SocketContext.jsx'
import { RoundProvider } from './context/RoundContext.jsx'
import LandingPage from './pages/LandingPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import ParticipantPage from './pages/ParticipantPage.jsx'
import AdminPage from './pages/AdminPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

function ProtectedRoute({ children, role }) {
  const { user, isLoading } = useAuth()
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-volt-bg">
        <div className="text-volt-green font-mono animate-pulse">Loading...</div>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/participant"
        element={
          <ProtectedRoute role="participant">
            <SocketProvider>
              <RoundProvider>
                <ParticipantPage />
              </RoundProvider>
            </SocketProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <SocketProvider>
              <RoundProvider>
                <AdminPage />
              </RoundProvider>
            </SocketProvider>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#161b22',
              color: '#e6edf3',
              border: '1px solid #30363d',
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '13px',
            },
            success: {
              iconTheme: { primary: '#39ff14', secondary: '#0d1117' },
            },
            error: {
              iconTheme: { primary: '#ff453a', secondary: '#0d1117' },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}
