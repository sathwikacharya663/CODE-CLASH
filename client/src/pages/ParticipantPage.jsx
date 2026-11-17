import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Play, Send, RefreshCw, Zap, ShieldAlert, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

import { useAuth } from '../context/AuthContext.jsx'
import { useRound } from '../context/RoundContext.jsx'
import { useSocket } from '../context/SocketContext.jsx'
import { useTabDetection } from '../hooks/useTabDetection.js'

import { getQuestions } from '../api/questions.js'
import { runCode, submitCode, getMySubmissions, autoSave } from '../api/participant.js'

import ParticipantLayout from '../components/participant/ParticipantLayout.jsx'
import QuestionTabs from '../components/participant/QuestionTabs.jsx'
import QuestionPanel from '../components/participant/QuestionPanel.jsx'
import LanguageSelector from '../components/participant/LanguageSelector.jsx'
import CodeEditor from '../components/participant/CodeEditor.jsx'
import ConsolePanel from '../components/participant/ConsolePanel.jsx'
import LockedRound from '../components/participant/LockedRound.jsx'
import EliminatedScreen from '../components/participant/EliminatedScreen.jsx'

const DEFAULT_TEMPLATES = {
  python: '# Python 3 Solution\nimport sys\n\ndef main():\n    # Your code here\n    pass\n\nif __name__ == "__main__":\n    main()\n',
  c: '#include <stdio.h>\n\nint main() {\n    // Your code here\n    return 0;\n}\n',
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}\n',
  java: 'import java.util.Scanner;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Your code here\n    }\n}\n',
}

export default function ParticipantPage() {
  const { user, logout } = useAuth()
  const { rounds, activeRound, timerMs, fetchRoundStates } = useRound()
  const { socket } = useSocket()
  const tabSwitchCount = useTabDetection()

  const [questions, setQuestions] = useState([])
  const [activeQIndex, setActiveQIndex] = useState(0)
  const [submissions, setSubmissions] = useState([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)

  // Editor states
  const [language, setLanguage] = useState('python')
  const [codeMap, setCodeMap] = useState({}) // key: `${qId}_${lang}`
  const [customInput, setCustomInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionFeedback, setSubmissionFeedback] = useState(null)
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [copyPasteDisabled, setCopyPasteDisabled] = useState(false)

  const activeQuestion = questions[activeQIndex] || null
  const currentRoundNum = activeRound?.round || (rounds[1]?.status === 'active' ? 1 : rounds[2]?.status === 'active' ? 2 : rounds[3]?.status === 'active' ? 3 : 1)
  const currentRoundState = rounds[currentRoundNum] || activeRound
  const isRoundActive = currentRoundState?.status === 'active'
  const isRoundEnded = currentRoundState?.status === 'ended' || (currentRoundState?.status === 'active' && timerMs <= 0)

  // Listen for copy-paste toggle from admin
  useEffect(() => {
    if (!socket) return
    socket.on('copy-paste:toggle', (data) => {
      setCopyPasteDisabled(!data.enabled)
      toast(data.enabled ? 'Editor copy-paste enabled by admin' : 'Editor copy-paste disabled by admin', {
        icon: '🔒',
      })
    })
    return () => {
      socket.off('copy-paste:toggle')
    }
  }, [socket])

  // Fetch questions whenever current round changes
  const loadRoundQuestions = useCallback(async (rNum) => {
    if (!rNum) return
    try {
      setLoadingQuestions(true)
      const [qRes, subRes] = await Promise.all([
        getQuestions(rNum),
        getMySubmissions(rNum).catch(() => ({ data: [] })),
      ])
      const qList = qRes.data || []
      setQuestions(qList)
      setSubmissions(subRes.data || [])
      setActiveQIndex(0)
    } catch (err) {
      console.error('Failed to load questions:', err)
    } finally {
      setLoadingQuestions(false)
    }
  }, [])

  useEffect(() => {
    if (currentRoundNum) {
      loadRoundQuestions(currentRoundNum)
    }
  }, [currentRoundNum, loadRoundQuestions])

  // Get current active code
  const currentCodeKey = activeQuestion ? `${activeQuestion._id}_${language}` : ''
  const currentCode = activeQuestion ? (codeMap[currentCodeKey] !== undefined ? codeMap[currentCodeKey] : getInitialCode(activeQuestion, language, currentRoundNum)) : ''

  function getInitialCode(q, lang, roundNum) {
    if (!q) return ''
    // If Round 2: load buggy code for language if available
    if (roundNum === 2 && q.buggyCode && q.buggyCode[lang]) {
      return q.buggyCode[lang]
    }
    // If starter code provided:
    if (q.starterCode && q.starterCode[lang]) {
      return q.starterCode[lang]
    }
    return DEFAULT_TEMPLATES[lang] || ''
  }

  const handleCodeChange = (newCode) => {
    if (!activeQuestion) return
    setCodeMap((prev) => ({
      ...prev,
      [currentCodeKey]: newCode,
    }))
  }

  // Periodic Auto-save hook
  const lastSavedCodeRef = useRef('')
  useEffect(() => {
    if (!isRoundActive || !activeQuestion || !currentCode || isRoundEnded) return
    if (currentCode === lastSavedCodeRef.current) return

    const timer = setTimeout(async () => {
      try {
        setIsAutoSaving(true)
        await autoSave({
          questionId: activeQuestion._id,
          code: currentCode,
          language,
          round: currentRoundNum,
        })
        lastSavedCodeRef.current = currentCode
      } catch {
        // Silently catch auto-save errors
      } finally {
        setTimeout(() => setIsAutoSaving(false), 1200)
      }
    }, 10000)

    return () => clearTimeout(timer)
  }, [currentCode, activeQuestion, language, currentRoundNum, isRoundActive, isRoundEnded])

  // Run Code
  const handleRunCode = async () => {
    if (!currentCode.trim()) {
      toast.error('Code editor is empty.')
      return
    }

    try {
      setIsRunning(true)
      setOutput('')
      setError('')
      setSubmissionFeedback(null)

      const res = await runCode({
        code: currentCode,
        language,
        stdin: customInput || activeQuestion?.sampleInput || '',
      })

      if (res.data.error) {
        setError(res.data.error)
        toast.error('Execution encountered errors.')
      } else {
        setOutput(res.data.output || '(No output returned)')
        toast.success('Run finished successfully.')
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Execution failed.')
      toast.error('Execution error.')
    } finally {
      setIsRunning(false)
    }
  }

  // Submit Code
  const handleSubmitCode = async () => {
    if (!currentCode.trim()) {
      toast.error('Cannot submit empty code.')
      return
    }

    if (!isRoundActive || isRoundEnded) {
      toast.error('Round is not currently active.')
      return
    }

    try {
      setIsSubmitting(true)
      setSubmissionFeedback(null)

      const res = await submitCode({
        questionId: activeQuestion._id,
        code: currentCode,
        language,
        round: currentRoundNum,
      })

      // Prompt Requirement: After submission, participants see only a neutral message:
      // "Your solution has been submitted successfully" (No points, no score)
      const msg = res.data.message || 'Your solution has been submitted successfully'
      setSubmissionFeedback(msg)
      toast.success(msg, { duration: 4000 })

      // Refresh submissions list to update QuestionTabs indicator
      const subRes = await getMySubmissions(currentRoundNum)
      setSubmissions(subRes.data || [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Check Round 3 Elimination status
  if (currentRoundNum === 3 && (user?.isEliminated || (!user?.isQualifiedRound3 && user?.role !== 'admin'))) {
    return (
      <ParticipantLayout
        teamName={user?.teamName}
        teamId={user?.teamId}
        currentRound={3}
        roundStatus="ended"
        remainingMs={0}
        tabSwitchCount={tabSwitchCount}
        onLogout={logout}
      >
        <EliminatedScreen teamName={user?.teamName} />
      </ParticipantLayout>
    )
  }

  // Check if round is locked
  if (!isRoundActive && currentRoundState?.status !== 'paused' && currentRoundState?.status !== 'ended') {
    return (
      <ParticipantLayout
        teamName={user?.teamName}
        teamId={user?.teamId}
        currentRound={currentRoundNum}
        roundStatus={currentRoundState?.status || 'locked'}
        remainingMs={0}
        tabSwitchCount={tabSwitchCount}
        onLogout={logout}
      >
        <LockedRound
          round={currentRoundNum}
          roundName={
            currentRoundNum === 1
              ? 'Code Replication'
              : currentRoundNum === 2
              ? 'Code Debugging'
              : 'Coding from Scratch'
          }
        />
      </ParticipantLayout>
    )
  }

  return (
    <ParticipantLayout
      teamName={user?.teamName}
      teamId={user?.teamId}
      currentRound={currentRoundNum}
      roundStatus={currentRoundState?.status}
      remainingMs={timerMs}
      tabSwitchCount={tabSwitchCount}
      isAutoSaving={isAutoSaving}
      onLogout={logout}
    >
      <div className="flex flex-col md:flex-row h-full w-full overflow-hidden">
        {/* ================= LEFT PANEL: QUESTIONS ================= */}
        <div className="w-full md:w-1/2 lg:w-5/12 h-1/2 md:h-full border-r border-volt-border flex flex-col bg-volt-bg">
          {/* Question Tabs (Q1, Q2, Q3...) */}
          <QuestionTabs
            questions={questions}
            activeIndex={activeQIndex}
            onSelect={(idx) => {
              setActiveQIndex(idx)
              setSubmissionFeedback(null)
            }}
            submissions={submissions}
          />

          {/* Question Details Content */}
          <div className="flex-1 overflow-y-auto">
            {loadingQuestions ? (
              <div className="flex items-center justify-center h-full text-volt-green font-mono text-sm animate-pulse">
                Loading problem statement...
              </div>
            ) : (
              <QuestionPanel question={activeQuestion} round={currentRoundNum} />
            )}
          </div>
        </div>

        {/* ================= RIGHT PANEL: CODE EDITOR + CONSOLE ================= */}
        <div className="w-full md:w-1/2 lg:w-7/12 h-1/2 md:h-full flex flex-col bg-volt-bg overflow-hidden">
          {/* Editor Action Bar */}
          <div className="h-12 bg-volt-bg-secondary border-b border-volt-border px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <LanguageSelector
                value={language}
                onChange={(lang) => {
                  setLanguage(lang)
                  setSubmissionFeedback(null)
                }}
                disabled={isRoundEnded}
              />

              <button
                type="button"
                onClick={() => {
                  if (activeQuestion && window.confirm('Reset code to initial template?')) {
                    handleCodeChange(getInitialCode(activeQuestion, language, currentRoundNum))
                  }
                }}
                disabled={isRoundEnded}
                className="text-[11px] font-mono text-volt-text-muted hover:text-volt-text flex items-center gap-1 disabled:opacity-40"
                title="Reset to starter/buggy code"
              >
                <RefreshCw className="w-3 h-3" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>

            {/* Run & Submit Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRunCode}
                disabled={isRunning || isSubmitting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded font-mono text-xs font-semibold border border-volt-green text-volt-green hover:bg-volt-green/10 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(57,255,20,0.15)]"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isRunning ? 'Running...' : 'Run'}</span>
              </button>

              <button
                type="button"
                onClick={handleSubmitCode}
                disabled={isSubmitting || isRunning || isRoundEnded}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded font-mono text-xs font-bold bg-volt-green text-volt-bg hover:bg-volt-green/90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(57,255,20,0.3)]"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Evaluating...' : 'Submit'}</span>
              </button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 overflow-hidden relative">
            <CodeEditor
              code={currentCode}
              onChange={handleCodeChange}
              language={language}
              readOnly={isRoundEnded}
              copyPasteDisabled={copyPasteDisabled}
            />
          </div>

          {/* Terminal Console Panel */}
          <div className="h-44 md:h-52 shrink-0">
            <ConsolePanel
              output={output}
              error={error}
              customInput={customInput}
              setCustomInput={setCustomInput}
              isRunning={isRunning}
              submissionStatus={submissionFeedback}
            />
          </div>
        </div>
      </div>
    </ParticipantLayout>
  )
}
