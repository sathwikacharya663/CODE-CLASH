import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import { useAuth } from '../context/AuthContext.jsx'
import { useRound } from '../context/RoundContext.jsx'
import { useSocket } from '../context/SocketContext.jsx'

import AdminLayout from '../components/admin/AdminLayout.jsx'
import AdminDashboard from '../components/admin/AdminDashboard.jsx'
import RoundControl from '../components/admin/RoundControl.jsx'
import Leaderboard from '../components/admin/Leaderboard.jsx'
import TeamManager from '../components/admin/TeamManager.jsx'
import QuestionManager from '../components/admin/QuestionManager.jsx'
import SubmissionViewer from '../components/admin/SubmissionViewer.jsx'
import WinnersScreen from '../components/admin/WinnersScreen.jsx'
import Top10Selector from '../components/admin/Top10Selector.jsx'
import CSVImport from '../components/admin/CSVImport.jsx'

import {
  getTeams,
  getLeaderboard,
  getSubmissions,
  unlockRound,
  pauseRound,
  resumeRound,
  endRound,
  resetRound,
  resetAllRounds,
  extendRound,
  createTeam,
  updateTeam,
  deleteTeam,
  revealWinners,
  getRoundStates,
} from '../api/admin.js'

export default function AdminPage() {
  const { user, logout } = useAuth()
  const { rounds, activeRound, timerMs, fetchRoundStates } = useRound()
  const { socket } = useSocket()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('overview')

  // Data state
  const [teams, setTeams] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(false)

  // Modal state
  const [showWinners, setShowWinners] = useState(false)
  const [winnersData, setWinnersData] = useState(null)
  const [showTop10Modal, setShowTop10Modal] = useState(false)
  const [showCSVModal, setShowCSVModal] = useState(false)

  // ─── Data fetchers ────────────────────────────────────────────────────────
  const refreshTeams = useCallback(async () => {
    try {
      const res = await getTeams()
      setTeams(res.data || [])
    } catch {
      toast.error('Failed to load teams')
    }
  }, [])

  const refreshLeaderboard = useCallback(async () => {
    try {
      const res = await getLeaderboard()
      setLeaderboard(res.data || [])
    } catch {
      toast.error('Failed to load leaderboard')
    }
  }, [])

  const refreshSubmissions = useCallback(async () => {
    try {
      const res = await getSubmissions()
      setSubmissions(res.data || [])
    } catch {
      toast.error('Failed to load submissions')
    }
  }, [])

  const refreshAll = useCallback(async () => {
    setLoading(true)
    await Promise.all([refreshTeams(), refreshLeaderboard(), refreshSubmissions(), fetchRoundStates()])
    setLoading(false)
  }, [refreshTeams, refreshLeaderboard, refreshSubmissions, fetchRoundStates])

  // Initial load
  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  // Real-time socket listeners (admin room events)
  useEffect(() => {
    if (!socket) return

    socket.on('submission:new', () => {
      refreshSubmissions()
      refreshLeaderboard()
    })

    socket.on('team:status', () => {
      refreshTeams()
    })

    socket.on('round:unlocked', () => {
      fetchRoundStates()
      toast.success('Round unlocked! Participants can now see it.', { icon: '🔓' })
    })

    socket.on('round:ended', () => {
      fetchRoundStates()
      refreshLeaderboard()
    })

    return () => {
      socket.off('submission:new')
      socket.off('team:status')
      socket.off('round:unlocked')
      socket.off('round:ended')
    }
  }, [socket, fetchRoundStates, refreshSubmissions, refreshLeaderboard, refreshTeams])

  // ─── Round controls ───────────────────────────────────────────────────────
  const handleUnlockRound = async (roundNum) => {
    try {
      await unlockRound(roundNum)
      toast.success(`Round ${roundNum} unlocked! Timer started.`, { icon: '🚀' })
      fetchRoundStates()
    } catch (err) {
      toast.error(err.response?.data?.message || `Cannot unlock Round ${roundNum}`)
    }
  }

  const handlePauseRound = async (roundNum) => {
    try {
      await pauseRound(roundNum)
      toast(`Round ${roundNum} paused`, { icon: '⏸' })
      fetchRoundStates()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to pause round')
    }
  }

  const handleResumeRound = async (roundNum) => {
    try {
      await resumeRound(roundNum)
      toast.success(`Round ${roundNum} resumed`, { icon: '▶️' })
      fetchRoundStates()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resume round')
    }
  }

  const handleEndRound = async (roundNum) => {
    try {
      await endRound(roundNum)
      toast.success(`Round ${roundNum} ended. Auto-submit triggered.`, { icon: '🏁' })
      fetchRoundStates()
      refreshLeaderboard()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to end round')
    }
  }

  const handleExtendRound = async (roundNum, minutes) => {
    await extendRound(roundNum, minutes)
    fetchRoundStates()
  }

  const handleResetRound = async (roundNum) => {
    try {
      await resetRound(roundNum, true)
      toast.success(`Round ${roundNum} reset to locked state.`, { icon: '🔄' })
      refreshAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset round')
    }
  }

  const handleResetAllRounds = async () => {
    try {
      await resetAllRounds()
      toast.success('All rounds reset and competition restarted!', { icon: '🔄' })
      refreshAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset competition')
    }
  }

  // ─── Winners reveal ───────────────────────────────────────────────────────
  const handleRevealWinners = async () => {
    try {
      const res = await revealWinners()
      setWinnersData(res.data)
      setShowWinners(true)
    } catch (err) {
      toast.error('Failed to load winner data')
    }
  }

  // ─── Logout ───────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  // Build a flat rounds object keyed by round number for sub-components
  const roundsObj = {}
  if (rounds[1]) roundsObj[1] = rounds[1]
  if (rounds[2]) roundsObj[2] = rounds[2]
  if (rounds[3]) roundsObj[3] = rounds[3]

  return (
    <>
      <AdminLayout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        adminUser={user}
        onLogout={handleLogout}
      >
        {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <AdminDashboard
            teams={teams}
            activeRound={activeRound}
            submissions={submissions}
            onRefresh={refreshAll}
            loading={loading}
          />
        )}

        {/* ── ROUND CONTROL ────────────────────────────────────────────── */}
        {activeTab === 'rounds' && (
          <RoundControl
            rounds={roundsObj}
            timerMs={timerMs}
            onUnlock={handleUnlockRound}
            onPause={handlePauseRound}
            onResume={handleResumeRound}
            onEnd={handleEndRound}
            onExtend={handleExtendRound}
            onResetRound={handleResetRound}
            onResetAllRounds={handleResetAllRounds}
            onOpenTop10Modal={() => setShowTop10Modal(true)}
            loading={loading}
          />
        )}

        {/* ── LEADERBOARD ──────────────────────────────────────────────── */}
        {activeTab === 'leaderboard' && (
          <Leaderboard
            leaderboard={leaderboard}
            onRefresh={refreshLeaderboard}
            onRevealWinners={handleRevealWinners}
            loading={loading}
          />
        )}

        {/* ── TEAMS ────────────────────────────────────────────────────── */}
        {activeTab === 'teams' && (
          <TeamManager
            teams={teams}
            onCreateTeam={createTeam}
            onUpdateTeam={updateTeam}
            onDeleteTeam={deleteTeam}
            onOpenCSVImport={() => setShowCSVModal(true)}
            onRefresh={refreshTeams}
          />
        )}

        {/* ── QUESTIONS ────────────────────────────────────────────────── */}
        {activeTab === 'questions' && <QuestionManager />}

        {/* ── SUBMISSIONS ──────────────────────────────────────────────── */}
        {activeTab === 'submissions' && (
          <SubmissionViewer
            submissions={submissions}
            onRefresh={refreshSubmissions}
            loading={loading}
          />
        )}

        {/* ── SETTINGS ─────────────────────────────────────────────────── */}
        {activeTab === 'settings' && (
          <AdminSettings socket={socket} />
        )}
      </AdminLayout>

      {/* ── GLOBAL MODALS ─────────────────────────────────────────────── */}
      <WinnersScreen
        isOpen={showWinners}
        onClose={() => setShowWinners(false)}
        winnersData={winnersData}
      />

      <Top10Selector
        isOpen={showTop10Modal}
        onClose={() => setShowTop10Modal(false)}
        teams={leaderboard}
        onSuccess={() => { refreshTeams(); refreshLeaderboard() }}
      />

      <CSVImport
        isOpen={showCSVModal}
        onClose={() => setShowCSVModal(false)}
        onSuccess={refreshTeams}
      />
    </>
  )
}

// ─── Inline Settings Panel ─────────────────────────────────────────────────
function AdminSettings({ socket }) {
  const [copyPasteEnabled, setCopyPasteEnabled] = useState(true)
  const [saving, setSaving] = useState(false)

  const handleToggleCopyPaste = async () => {
    try {
      setSaving(true)
      const { updateSettings } = await import('../api/admin.js')
      const newVal = !copyPasteEnabled
      await updateSettings({ copyPasteEnabled: newVal })
      setCopyPasteEnabled(newVal)
      if (socket) socket.emit('admin:toggle-copy-paste', { enabled: newVal })
      toast.success(`Copy-paste in editor: ${newVal ? 'Enabled' : 'Disabled'}`)
    } catch {
      toast.error('Failed to update settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6">
      <div>
        <h2 className="font-mono text-2xl font-bold text-volt-text">Platform Settings</h2>
        <p className="text-volt-text-muted font-mono text-xs mt-1">
          Real-time control toggles broadcast to all connected participant sessions via Socket.IO.
        </p>
      </div>

      <div className="max-w-xl space-y-4">
        {/* Copy-Paste Toggle */}
        <div className="p-5 rounded-xl bg-volt-bg-secondary border border-volt-border flex items-center justify-between gap-4">
          <div>
            <h3 className="font-mono text-sm font-bold text-volt-text mb-1">
              Editor Copy-Paste
            </h3>
            <p className="font-mono text-xs text-volt-text-muted leading-relaxed">
              When disabled, Ctrl+C and Ctrl+V shortcuts are blocked inside the Monaco code editor for all participant sessions in real time.
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleCopyPaste}
            disabled={saving}
            className={`w-14 h-7 rounded-full transition-all duration-300 relative shrink-0 ${
              copyPasteEnabled ? 'bg-volt-green shadow-[0_0_10px_rgba(57,255,20,0.4)]' : 'bg-volt-bg-tertiary border border-volt-border'
            }`}
          >
            <span
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-volt-bg transition-all duration-300 shadow ${
                copyPasteEnabled ? 'left-7' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        {/* Info Card */}
        <div className="p-4 rounded-xl bg-volt-bg-secondary border border-volt-border/60 font-mono text-xs text-volt-text-muted space-y-2">
          <p className="font-bold text-volt-text">Scoring Rules (Always On)</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Round 1 & 2: Full points if all test cases pass.</li>
            <li>Round 3: Partial points per test case passed.</li>
            <li>Time bonus: +10% if submitted in first half of round.</li>
            <li>Wrong submission penalty: configured per question.</li>
            <li>Scores are hidden from participants at all times.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
