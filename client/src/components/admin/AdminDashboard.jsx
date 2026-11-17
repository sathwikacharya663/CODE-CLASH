import React from 'react'
import { Users, Wifi, Timer, Code2, AlertTriangle, RefreshCw } from 'lucide-react'

export default function AdminDashboard({
  teams = [],
  activeRound,
  submissions = [],
  onRefresh,
  loading = false,
}) {
  const totalTeams = teams.length
  const onlineTeams = teams.filter((t) => t.isOnline).length
  const totalSubmissions = submissions.length
  const totalTabSwitches = teams.reduce((acc, t) => acc + (t.tabSwitchCount || 0), 0)

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-mono text-2xl font-bold text-volt-text">Competition Overview</h2>
          <p className="text-volt-text-muted font-mono text-xs mt-1">
            Real-time status monitoring for 30 college participant teams
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-mono text-xs bg-volt-bg-secondary border border-volt-border text-volt-text hover:border-volt-green hover:text-volt-green transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="p-4 rounded-xl bg-volt-bg-secondary border border-volt-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-volt-text-muted uppercase">Total Teams</span>
            <Users className="w-4 h-4 text-volt-cyan" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-volt-text">{totalTeams}</span>
            <span className="font-mono text-xs text-volt-text-muted">registered</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="p-4 rounded-xl bg-volt-bg-secondary border border-volt-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-volt-text-muted uppercase">Online Now</span>
            <Wifi className="w-4 h-4 text-volt-green animate-pulse" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-volt-green">{onlineTeams}</span>
            <span className="font-mono text-xs text-volt-text-muted">/ {totalTeams} active</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="p-4 rounded-xl bg-volt-bg-secondary border border-volt-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-volt-text-muted uppercase">Active Round</span>
            <Timer className="w-4 h-4 text-volt-yellow" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold text-volt-yellow">
              {activeRound ? `Round ${activeRound.round}` : 'None'}
            </span>
            <span className="font-mono text-xs text-volt-text-muted">
              {activeRound ? activeRound.status : 'All Locked'}
            </span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="p-4 rounded-xl bg-volt-bg-secondary border border-volt-border shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-volt-text-muted uppercase">Proctor Alerts</span>
            <AlertTriangle className="w-4 h-4 text-volt-red" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold text-volt-red">{totalTabSwitches}</span>
            <span className="font-mono text-xs text-volt-text-muted">tab switches</span>
          </div>
        </div>
      </div>

      {/* Teams Status Table */}
      <div className="rounded-xl bg-volt-bg-secondary border border-volt-border overflow-hidden">
        <div className="px-5 py-3.5 border-b border-volt-border flex items-center justify-between bg-volt-bg-tertiary/40">
          <h3 className="font-mono text-sm font-semibold text-volt-text">Teams Live Status</h3>
          <span className="font-mono text-xs text-volt-text-muted">
            Showing {teams.length} teams
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-volt-bg-tertiary/60 text-volt-text-muted uppercase tracking-wider text-[11px] border-b border-volt-border">
              <tr>
                <th className="py-3 px-4">Team ID</th>
                <th className="py-3 px-4">Team Name</th>
                <th className="py-3 px-4">Members</th>
                <th className="py-3 px-4">Connection</th>
                <th className="py-3 px-4">Tab Switches</th>
                <th className="py-3 px-4 text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-volt-border">
              {teams.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-volt-text-muted">
                    No teams found. Use the "Teams" tab or bulk CSV import to add teams.
                  </td>
                </tr>
              ) : (
                teams.map((team) => (
                  <tr key={team._id || team.teamId} className="hover:bg-volt-bg-tertiary/30 transition-colors">
                    <td className="py-3 px-4 text-volt-cyan font-semibold">{team.teamId}</td>
                    <td className="py-3 px-4 text-volt-text font-medium">{team.teamName}</td>
                    <td className="py-3 px-4 text-volt-text-muted max-w-xs truncate">
                      {Array.isArray(team.members) ? team.members.join(', ') : '-'}
                    </td>
                    <td className="py-3 px-4">
                      {team.isOnline ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-volt-green/10 text-volt-green border border-volt-green/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-volt-green animate-ping" />
                          Online
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-volt-bg-tertiary text-volt-text-muted border border-volt-border">
                          Offline
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {team.tabSwitchCount > 0 ? (
                        <span className="text-volt-red font-semibold inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {team.tabSwitchCount}
                        </span>
                      ) : (
                        <span className="text-volt-text-muted">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-volt-green font-bold">
                      {team.totalScore !== undefined ? team.totalScore : (team.points || 0)} pts
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
