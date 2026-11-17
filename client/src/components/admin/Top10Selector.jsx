import React, { useState, useEffect } from 'react'
import { Users, CheckCircle, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../common/Modal.jsx'
import { selectTop10, manualSelectTop10 } from '../../api/admin.js'

export default function Top10Selector({
  isOpen,
  onClose,
  teams = [],
  onSuccess,
}) {
  const [selectedIds, setSelectedIds] = useState([])
  const [saving, setSaving] = useState(false)

  // Sort teams by total points desc
  const sortedTeams = [...teams].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))

  useEffect(() => {
    // Initialize selected with currently qualified teams
    const currentQual = teams.filter((t) => t.isQualifiedRound3).map((t) => t.teamId)
    if (currentQual.length > 0) {
      setSelectedIds(currentQual)
    } else {
      // Default to top 10 by score
      setSelectedIds(sortedTeams.slice(0, 10).map((t) => t.teamId))
    }
  }, [teams])

  const handleToggle = (teamId) => {
    setSelectedIds((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    )
  }

  const handleAutoSelect = async () => {
    try {
      setSaving(true)
      const res = await selectTop10()
      toast.success(res.data?.message || 'Top 10 auto-selected based on R1 & R2 scores')
      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Auto-selection failed')
    } finally {
      setSaving(false)
    }
  }

  const handleManualSave = async () => {
    if (selectedIds.length === 0) {
      toast.error('Select at least one team for Round 3')
      return
    }

    try {
      setSaving(true)
      await manualSelectTop10(selectedIds)
      toast.success(`Saved ${selectedIds.length} qualifiers for Round 3`)
      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save qualifiers')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Round 3 Qualifiers (Top 10)">
      <div className="space-y-4 font-mono text-xs max-h-[75vh] overflow-y-auto pr-1">
        <div className="p-3 rounded-lg bg-volt-purple/10 border border-volt-purple/30 text-volt-purple text-[11px] leading-relaxed">
          Round 3 (Coding from Scratch) is restricted to the top 10 teams. Unselected teams will see "Eliminated, thank you for participating" and cannot access Round 3.
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-between pb-2 border-b border-volt-border">
          <div className="text-volt-text font-bold">
            Selected: <span className="text-volt-green">{selectedIds.length}</span> / 10
          </div>
          <button
            type="button"
            onClick={handleAutoSelect}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-volt-cyan text-volt-bg font-bold hover:bg-volt-cyan/90 transition-all text-xs"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>Auto-Pick Top 10 by Score</span>
          </button>
        </div>

        {/* Team list with checkboxes */}
        <div className="space-y-1.5 divide-y divide-volt-border/50">
          {sortedTeams.map((team, idx) => {
            const isSelected = selectedIds.includes(team.teamId)
            return (
              <label
                key={team.teamId}
                className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${
                  isSelected ? 'bg-volt-green/10 border border-volt-green/30' : 'hover:bg-volt-bg-tertiary/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggle(team.teamId)}
                    className="w-4 h-4 rounded text-volt-green focus:ring-0 bg-volt-bg border-volt-border cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-volt-text mr-2">#{idx + 1} {team.teamName}</span>
                    <span className="text-[10px] text-volt-text-muted">({team.teamId})</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-volt-green font-bold">{team.totalScore || 0} pts</span>
                  {isSelected && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-volt-green/20 text-volt-green font-bold">
                      QUALIFIED
                    </span>
                  )}
                </div>
              </label>
            )
          })}
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-volt-border">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded bg-volt-bg-tertiary border border-volt-border text-volt-text-muted hover:text-volt-text"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleManualSave}
            disabled={saving}
            className="px-4 py-1.5 rounded bg-volt-green text-volt-bg font-bold hover:bg-volt-green/90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : `Confirm Qualifiers (${selectedIds.length} Teams)`}
          </button>
        </div>
      </div>
    </Modal>
  )
}
