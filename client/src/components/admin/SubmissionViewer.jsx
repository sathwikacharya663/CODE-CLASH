import React, { useState } from 'react'
import { Code2, CheckCircle2, XCircle, Clock, Eye, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../common/Modal.jsx'
import { adjustPoints } from '../../api/admin.js'

export default function SubmissionViewer({
  submissions = [],
  onRefresh,
  loading = false,
}) {
  const [filterRound, setFilterRound] = useState('all')
  const [selectedSub, setSelectedSub] = useState(null)
  const [pointDelta, setPointDelta] = useState(0)
  const [adjusting, setAdjusting] = useState(false)

  const filtered = submissions.filter((s) => {
    if (filterRound !== 'all' && s.round !== Number(filterRound)) return false
    return true
  })

  const handleAdjustPoints = async () => {
    if (!selectedSub || pointDelta === 0) return
    try {
      setAdjusting(true)
      await adjustPoints(selectedSub._id, Number(pointDelta))
      toast.success(`Adjusted points by ${pointDelta > 0 ? `+${pointDelta}` : pointDelta}`)
      setSelectedSub(null)
      setPointDelta(0)
      if (onRefresh) onRefresh()
    } catch (err) {
      toast.error('Failed to adjust points')
    } finally {
      setAdjusting(false)
    }
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-mono text-2xl font-bold text-volt-text">Submissions Inspector</h2>
          <p className="text-volt-text-muted font-mono text-xs mt-1">
            Review submitted code, execution errors, test case assertions, and administer point adjustments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterRound}
            onChange={(e) => setFilterRound(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-volt-bg-secondary border border-volt-border text-volt-text font-mono text-xs focus:outline-none focus:border-volt-green"
          >
            <option value="all">All Rounds</option>
            <option value="1">Round 1 (Replication)</option>
            <option value="2">Round 2 (Debugging)</option>
            <option value="3">Round 3 (Scratch)</option>
          </select>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs bg-volt-bg-secondary border border-volt-border text-volt-text hover:border-volt-green transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="rounded-xl bg-volt-bg-secondary border border-volt-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-volt-bg-tertiary/80 text-volt-text-muted uppercase tracking-wider text-[11px] border-b border-volt-border">
              <tr>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Team</th>
                <th className="py-3 px-4">Round</th>
                <th className="py-3 px-4">Question</th>
                <th className="py-3 px-4">Lang</th>
                <th className="py-3 px-4">Tests Passed</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Points</th>
                <th className="py-3 px-4 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-volt-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-volt-text-muted">
                    No submissions found matching criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s._id} className="hover:bg-volt-bg-tertiary/30 transition-colors">
                    <td className="py-3 px-4 text-volt-text-muted text-[11px]">
                      {new Date(s.submittedAt || s.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-volt-cyan">{s.teamId}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-volt-bg-tertiary border border-volt-border text-volt-text">
                        R{s.round}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-volt-text max-w-xs truncate">
                      {s.questionId?.title || 'Problem'}
                    </td>
                    <td className="py-3 px-4 uppercase text-volt-yellow font-medium">{s.language}</td>
                    <td className="py-3 px-4">
                      <span className="text-volt-text font-bold">
                        {s.totalTestsPassed || 0} / {s.totalTests || s.testCaseResults?.length || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {s.status === 'accepted' ? (
                        <span className="inline-flex items-center gap-1 text-volt-green font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Accepted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-volt-red font-semibold">
                          <XCircle className="w-3.5 h-3.5" />
                          {s.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-volt-green">
                      {s.pointsEarned || 0} pts
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSub(s)
                          setPointDelta(0)
                        }}
                        className="p-1.5 rounded text-volt-text-muted hover:text-volt-green hover:bg-volt-bg transition-colors"
                        title="View Submission Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Submission Modal */}
      {selectedSub && (
        <Modal
          isOpen={!!selectedSub}
          onClose={() => setSelectedSub(null)}
          title={`Submission: ${selectedSub.teamId} - Round ${selectedSub.round}`}
        >
          <div className="space-y-4 font-mono text-xs max-h-[75vh] overflow-y-auto pr-1">
            {/* Meta pill bar */}
            <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-volt-bg border border-volt-border">
              <span className="text-volt-text-muted">Status:</span>
              <span className="font-bold text-volt-green uppercase">{selectedSub.status}</span>
              <span className="text-volt-border">|</span>
              <span className="text-volt-text-muted">Lang:</span>
              <span className="text-volt-yellow uppercase font-bold">{selectedSub.language}</span>
              <span className="text-volt-border">|</span>
              <span className="text-volt-text-muted">Points Awarded:</span>
              <span className="text-volt-green font-bold">{selectedSub.pointsEarned} pts</span>
            </div>

            {/* Code Block */}
            <div>
              <label className="block text-volt-text-muted mb-1 text-[11px] uppercase font-bold">
                Submitted Source Code:
              </label>
              <pre className="p-3 rounded-lg bg-volt-bg border border-volt-border text-volt-text font-mono text-xs overflow-x-auto leading-relaxed max-h-64">
                {selectedSub.code}
              </pre>
            </div>

            {/* Test Case Breakdown */}
            {selectedSub.testCaseResults && selectedSub.testCaseResults.length > 0 && (
              <div>
                <label className="block text-volt-text-muted mb-1 text-[11px] uppercase font-bold">
                  Test Case Results:
                </label>
                <div className="space-y-2">
                  {selectedSub.testCaseResults.map((tc, i) => (
                    <div
                      key={i}
                      className={`p-2.5 rounded-lg border text-xs ${
                        tc.passed
                          ? 'bg-volt-green/5 border-volt-green/30'
                          : 'bg-volt-red/5 border-volt-red/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1 font-bold">
                        <span className={tc.passed ? 'text-volt-green' : 'text-volt-red'}>
                          Test #{i + 1}: {tc.passed ? 'PASSED' : 'FAILED'}
                        </span>
                        {tc.timeTaken && (
                          <span className="text-[10px] text-volt-text-muted">{tc.timeTaken}ms</span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-volt-text-muted">Input: </span>
                          <span className="text-volt-text">{tc.input || '(empty)'}</span>
                        </div>
                        <div>
                          <span className="text-volt-text-muted">Expected: </span>
                          <span className="text-volt-cyan">{tc.expectedOutput}</span>
                        </div>
                      </div>
                      {!tc.passed && tc.actualOutput && (
                        <div className="mt-1 text-[11px]">
                          <span className="text-volt-red">Actual Output: </span>
                          <span className="text-volt-text">{tc.actualOutput}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Manual Score Adjustment */}
            <div className="p-3 rounded-lg bg-volt-bg-tertiary border border-volt-border space-y-2">
              <label className="block text-volt-text font-bold text-[11px] uppercase">
                Adjust Points for This Submission
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={pointDelta}
                  onChange={(e) => setPointDelta(Number(e.target.value))}
                  placeholder="+10 or -5"
                  className="w-32 p-1.5 rounded bg-volt-bg border border-volt-border text-volt-text text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={handleAdjustPoints}
                  disabled={pointDelta === 0 || adjusting}
                  className="px-3 py-1.5 rounded bg-volt-cyan text-volt-bg font-bold hover:bg-volt-cyan/90 disabled:opacity-50"
                >
                  {adjusting ? 'Adjusting...' : 'Apply Points Adjustment'}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-volt-border">
              <button
                type="button"
                onClick={() => setSelectedSub(null)}
                className="px-4 py-1.5 rounded bg-volt-bg-tertiary border border-volt-border text-volt-text hover:text-volt-text"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
