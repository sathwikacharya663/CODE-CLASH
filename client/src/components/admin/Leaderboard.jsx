import React, { useState } from 'react'
import { Trophy, Download, Sparkles, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Leaderboard({
  leaderboard = [],
  onRefresh,
  onRevealWinners,
  loading = false,
}) {
  const [downloading, setDownloading] = useState(false)

  const handleExportCSV = () => {
    try {
      setDownloading(true)
      const headers = ['Rank', 'Team ID', 'Team Name', 'Members', 'R1 Score', 'R2 Score', 'R3 Score', 'Total Points', 'Final Score', 'Qualified R3', 'Last Submission']
      const rows = leaderboard.map((item, index) => [
        index + 1,
        `"${item.teamId}"`,
        `"${item.teamName}"`,
        `"${Array.isArray(item.members) ? item.members.join(', ') : ''}"`,
        item.r1Score || 0,
        item.r2Score || 0,
        item.r3Score || 0,
        item.totalScore || 0,
        item.finalScore !== null && item.finalScore !== undefined ? item.finalScore : '-',
        item.isQualifiedRound3 ? 'YES' : 'NO',
        item.lastSubmittedAt ? new Date(item.lastSubmittedAt).toLocaleString() : '-',
      ])

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement('a')
      link.setAttribute('href', encodedUri)
      link.setAttribute('download', `codeclash_leaderboard_${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Leaderboard exported as CSV')
    } catch {
      toast.error('Failed to export CSV')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-mono text-2xl font-bold text-volt-text">Live Leaderboard</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-volt-red/10 border border-volt-red/30 text-volt-red">
              ADMIN ONLY
            </span>
          </div>
          <p className="text-volt-text-muted font-mono text-xs mt-1">
            Scores, points, and test case pass rates are hidden from participants and visible exclusively here.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs bg-volt-bg-secondary border border-volt-border text-volt-text hover:border-volt-green transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={downloading || leaderboard.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs bg-volt-bg-secondary border border-volt-border text-volt-cyan hover:border-volt-cyan transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={onRevealWinners}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg font-mono text-xs font-bold bg-gradient-to-r from-volt-yellow to-volt-green text-volt-bg hover:opacity-95 shadow-[0_0_15px_rgba(255,214,10,0.3)] transition-all"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>Reveal Winners Screen</span>
          </button>
        </div>
      </div>

      {/* Final Score formula info */}
      <div className="px-4 py-2.5 rounded-lg bg-volt-bg-secondary border border-volt-border/60 font-mono text-[11px] text-volt-text-muted">
        <span className="text-volt-cyan font-bold">Final Score formula:</span>{' '}
        [(R1 + R2) ÷ 200 × 30] + [R3 × 70%] — only shown for teams that played Round 3. Teams without R3 show <span className="text-volt-text-muted font-bold">—</span>.
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-xl bg-volt-bg-secondary border border-volt-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-volt-bg-tertiary/80 text-volt-text-muted uppercase tracking-wider text-[11px] border-b border-volt-border">
              <tr>
                <th className="py-3 px-4 w-14 text-center">Rank</th>
                <th className="py-3 px-4">Team</th>
                <th className="py-3 px-4">Members</th>
                <th className="py-3 px-4 text-center">R1</th>
                <th className="py-3 px-4 text-center">R2</th>
                <th className="py-3 px-4 text-center">R3</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-center">Final Score</th>
                <th className="py-3 px-4 text-right">Last Submit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-volt-border">
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-volt-text-muted">
                    No leaderboard scores recorded yet. Submissions will rank teams automatically.
                  </td>
                </tr>
              ) : (
                leaderboard.map((team, index) => {
                  const rank = index + 1
                  return (
                    <tr
                      key={team.teamId}
                      className={`hover:bg-volt-bg-tertiary/40 transition-colors ${
                        rank === 1
                          ? 'bg-volt-yellow/5'
                          : rank === 2
                          ? 'bg-volt-cyan/5'
                          : rank === 3
                          ? 'bg-volt-purple/5'
                          : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        {rank === 1 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-volt-yellow text-volt-bg font-bold shadow-[0_0_10px_#ffd60a]">1</span>
                        ) : rank === 2 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-volt-cyan text-volt-bg font-bold shadow-[0_0_10px_#00f5ff]">2</span>
                        ) : rank === 3 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-volt-purple text-volt-bg font-bold shadow-[0_0_10px_#bf5af2]">3</span>
                        ) : (
                          <span className="text-volt-text-muted font-semibold">#{rank}</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-volt-text flex items-center gap-1.5">
                          <span>{team.teamName}</span>
                          {team.isQualifiedRound3 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-volt-purple/20 text-volt-purple border border-volt-purple/40">R3</span>
                          )}
                          {team.isEliminated && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-volt-red/20 text-volt-red border border-volt-red/40">OUT</span>
                          )}
                        </div>
                        <div className="text-[10px] text-volt-text-muted">{team.teamId}</div>
                      </td>

                      <td className="py-3 px-4 text-volt-text-muted max-w-xs truncate">
                        {Array.isArray(team.members) ? team.members.join(', ') : '-'}
                      </td>

                      <td className="py-3 px-4 text-center text-volt-cyan font-medium">
                        {team.r1Score || 0}
                      </td>

                      <td className="py-3 px-4 text-center text-volt-yellow font-medium">
                        {team.r2Score || 0}
                      </td>

                      <td className="py-3 px-4 text-center text-volt-purple font-medium">
                        {team.r3Score || 0}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <span className="text-volt-green font-bold text-sm">
                          {team.totalScore || 0} pts
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {team.finalScore !== null && team.finalScore !== undefined ? (
                          <span className="font-bold text-volt-yellow">{team.finalScore} / 100</span>
                        ) : (
                          <span className="text-volt-text-muted">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right text-[11px] text-volt-text-muted">
                        {team.lastSubmittedAt
                          ? new Date(team.lastSubmittedAt).toLocaleTimeString()
                          : '—'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
