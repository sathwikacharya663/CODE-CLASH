import React, { useState } from 'react'
import { Plus, Upload, Trash2, Edit2, ShieldAlert, Award, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../common/Modal.jsx'

export default function TeamManager({
  teams = [],
  onCreateTeam,
  onUpdateTeam,
  onDeleteTeam,
  onOpenCSVImport,
  onRefresh,
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState(null)
  const [formData, setFormData] = useState({
    teamName: '',
    members: '',
    password: '',
    manualPointsAdjustment: 0,
  })

  const openAddModal = () => {
    setEditingTeam(null)
    setFormData({
      teamName: '',
      members: '',
      password: '',
      manualPointsAdjustment: 0,
    })
    setModalOpen(true)
  }

  const openEditModal = (team) => {
    setEditingTeam(team)
    setFormData({
      teamName: team.teamName || '',
      members: Array.isArray(team.members) ? team.members.join(', ') : '',
      password: '',
      manualPointsAdjustment: team.manualPointsAdjustment || 0,
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.teamName.trim()) {
      toast.error('Team name is required')
      return
    }

    const payload = {
      teamName: formData.teamName.trim(),
      members: formData.members.split(',').map((m) => m.trim()).filter(Boolean),
      manualPointsAdjustment: Number(formData.manualPointsAdjustment) || 0,
    }

    if (formData.password.trim()) {
      payload.password = formData.password.trim()
    }

    try {
      if (editingTeam) {
        await onUpdateTeam(editingTeam._id || editingTeam.teamId, payload)
        toast.success(`Updated ${payload.teamName}`)
      } else {
        await onCreateTeam(payload)
        toast.success(`Created team ${payload.teamName}`)
      }
      setModalOpen(false)
      onRefresh()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed')
    }
  }

  const handleDelete = async (team) => {
    if (window.confirm(`Are you sure you want to permanently delete team ${team.teamName} (${team.teamId})?`)) {
      try {
        await onDeleteTeam(team._id || team.teamId)
        toast.success(`Deleted ${team.teamName}`)
        onRefresh()
      } catch (err) {
        toast.error(err.response?.data?.message || 'Delete failed')
      }
    }
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-mono text-2xl font-bold text-volt-text">Team Management</h2>
          <p className="text-volt-text-muted font-mono text-xs mt-1">
            Add, edit, delete, or bulk-import participant team credentials and manage manual score overrides.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenCSVImport}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-mono text-xs bg-volt-bg-secondary border border-volt-border text-volt-cyan hover:border-volt-cyan transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Bulk Import CSV</span>
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg font-mono text-xs font-bold bg-volt-green text-volt-bg hover:bg-volt-green/90 shadow-[0_0_12px_rgba(57,255,20,0.25)] transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Team</span>
          </button>
        </div>
      </div>

      {/* Teams Table */}
      <div className="rounded-xl bg-volt-bg-secondary border border-volt-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-volt-bg-tertiary/80 text-volt-text-muted uppercase tracking-wider text-[11px] border-b border-volt-border">
              <tr>
                <th className="py-3 px-4">Team ID</th>
                <th className="py-3 px-4">Team Name</th>
                <th className="py-3 px-4">Members</th>
                <th className="py-3 px-4">Scores (R1 | R2 | R3 | Total)</th>
                <th className="py-3 px-4">Tab Alerts</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-volt-border">
              {teams.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-volt-text-muted">
                    No teams configured yet.
                  </td>
                </tr>
              ) : (
                teams.map((t) => (
                  <tr key={t._id || t.teamId} className="hover:bg-volt-bg-tertiary/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-volt-cyan">{t.teamId}</td>
                    <td className="py-3 px-4 text-volt-text font-medium">{t.teamName}</td>
                    <td className="py-3 px-4 text-volt-text-muted max-w-xs truncate">
                      {Array.isArray(t.members) ? t.members.join(', ') : '-'}
                    </td>
                    <td className="py-3 px-4 text-center text-volt-cyan font-medium">{t.r1Score || 0}</td>
                    <td className="py-3 px-4 text-center text-volt-yellow font-medium">{t.r2Score || 0}</td>
                    <td className="py-3 px-4 text-center text-volt-purple font-medium">{t.r3Score || 0}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-volt-green font-bold">{t.totalScore || 0} pts</span>
                      {t.manualPointsAdjustment !== 0 && (
                        <span className="ml-1 text-[11px] text-volt-yellow font-mono">
                          ({t.manualPointsAdjustment > 0 ? `+${t.manualPointsAdjustment}` : t.manualPointsAdjustment})
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {t.tabSwitchCount > 0 ? (
                        <span className="text-volt-red inline-flex items-center gap-1 font-semibold">
                          <ShieldAlert className="w-3 h-3" />
                          {t.tabSwitchCount}
                        </span>
                      ) : (
                        <span className="text-volt-text-muted">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(t)}
                          className="p-1 rounded text-volt-text-muted hover:text-volt-cyan hover:bg-volt-bg transition-colors"
                          title="Edit Team & Manual Score Adjustment"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(t)}
                          className="p-1 rounded text-volt-text-muted hover:text-volt-red hover:bg-volt-bg transition-colors"
                          title="Delete Team"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Team Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTeam ? `Edit Team: ${editingTeam.teamName}` : 'Add New Team'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block text-volt-text-muted mb-1 uppercase tracking-wider text-[11px]">
              Team Name *
            </label>
            <input
              type="text"
              required
              value={formData.teamName}
              onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
              placeholder="e.g. Binary Beasts"
              className="w-full px-3 py-2 rounded bg-volt-bg border border-volt-border text-volt-text focus:outline-none focus:border-volt-green text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-volt-text-muted mb-1 uppercase tracking-wider text-[11px]">
              Members (comma separated)
            </label>
            <input
              type="text"
              value={formData.members}
              onChange={(e) => setFormData({ ...formData, members: e.target.value })}
              placeholder="e.g. Alice, Bob, Charlie"
              className="w-full px-3 py-2 rounded bg-volt-bg border border-volt-border text-volt-text focus:outline-none focus:border-volt-green text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-volt-text-muted mb-1 uppercase tracking-wider text-[11px]">
              Password {editingTeam ? '(leave blank to keep current)' : '*'}
            </label>
            <input
              type="text"
              required={!editingTeam}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={editingTeam ? 'Enter new password if changing' : 'Enter login password'}
              className="w-full px-3 py-2 rounded bg-volt-bg border border-volt-border text-volt-text focus:outline-none focus:border-volt-green text-xs font-mono"
            />
          </div>

          {editingTeam && (
            <div>
              <label className="block text-volt-text-muted mb-1 uppercase tracking-wider text-[11px]">
                Manual Points Adjustment (+/- pts)
              </label>
              <input
                type="number"
                value={formData.manualPointsAdjustment}
                onChange={(e) => setFormData({ ...formData, manualPointsAdjustment: e.target.value })}
                placeholder="e.g. 10 or -5"
                className="w-full px-3 py-2 rounded bg-volt-bg border border-volt-border text-volt-text focus:outline-none focus:border-volt-green text-xs font-mono"
              />
              <p className="text-[10px] text-volt-text-muted mt-1">
                Admin manual override: points added or deducted from final tally.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-volt-border">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-3.5 py-1.5 rounded bg-volt-bg-tertiary border border-volt-border text-volt-text-muted hover:text-volt-text"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-volt-green text-volt-bg font-bold hover:bg-volt-green/90"
            >
              {editingTeam ? 'Save Changes' : 'Create Team'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
