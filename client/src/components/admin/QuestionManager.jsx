import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Edit2, FileText, CheckCircle2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../common/Modal.jsx'
import { getQuestions, createQuestion, updateQuestion, deleteQuestion } from '../../api/questions.js'

export default function QuestionManager() {
  const [activeRound, setActiveRound] = useState(1)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState(null)

  const emptyForm = {
    round: 1,
    order: 1,
    title: '',
    description: '',
    inputFormat: '',
    outputFormat: '',
    constraints: '',
    sampleInput: '',
    sampleOutput: '',
    expectedOutput: '',
    totalPoints: 100,
    timeBonusEnabled: true,
    penaltyPerWrongSubmission: 5,
    starterCode: { python: '', c: '', cpp: '', java: '' },
    buggyCode: { python: '', c: '', cpp: '', java: '' },
    testCases: [{ input: '', expectedOutput: '', points: 50 }],
  }

  const [formData, setFormData] = useState(emptyForm)

  const loadQuestions = useCallback(async (roundNum) => {
    try {
      setLoading(true)
      const res = await getQuestions(roundNum)
      setQuestions(res.data || [])
    } catch (err) {
      toast.error('Failed to load questions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadQuestions(activeRound)
  }, [activeRound, loadQuestions])

  const openAddModal = () => {
    setEditingQuestion(null)
    setFormData({ ...emptyForm, round: activeRound, order: questions.length + 1 })
    setModalOpen(true)
  }

  const openEditModal = (q) => {
    setEditingQuestion(q)
    setFormData({
      round: q.round,
      order: q.order || 1,
      title: q.title || '',
      description: q.description || '',
      inputFormat: q.inputFormat || '',
      outputFormat: q.outputFormat || '',
      constraints: q.constraints || '',
      sampleInput: q.sampleInput || '',
      sampleOutput: q.sampleOutput || '',
      expectedOutput: q.expectedOutput || '',
      totalPoints: q.totalPoints || 100,
      timeBonusEnabled: !!q.timeBonusEnabled,
      penaltyPerWrongSubmission: q.penaltyPerWrongSubmission || 0,
      starterCode: q.starterCode || { python: '', c: '', cpp: '', java: '' },
      buggyCode: q.buggyCode || { python: '', c: '', cpp: '', java: '' },
      testCases: q.testCases && q.testCases.length > 0 ? q.testCases : [{ input: '', expectedOutput: '', points: 50 }],
    })
    setModalOpen(true)
  }

  const handleAddTestCase = () => {
    setFormData((prev) => ({
      ...prev,
      testCases: [...prev.testCases, { input: '', expectedOutput: '', points: 50 }],
    }))
  }

  const handleRemoveTestCase = (index) => {
    setFormData((prev) => ({
      ...prev,
      testCases: prev.testCases.filter((_, i) => i !== index),
    }))
  }

  const handleTestCaseChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.testCases]
      updated[index] = { ...updated[index], [field]: field === 'points' ? Number(value) : value }
      return { ...prev, testCases: updated }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Title and description are required')
      return
    }

    try {
      if (editingQuestion) {
        await updateQuestion(editingQuestion._id, formData)
        toast.success('Question updated successfully')
      } else {
        await createQuestion(formData)
        toast.success('Question created successfully')
      }
      setModalOpen(false)
      loadQuestions(activeRound)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed')
    }
  }

  const handleDelete = async (q) => {
    if (window.confirm(`Delete question "${q.title}"?`)) {
      try {
        await deleteQuestion(q._id)
        toast.success('Question deleted')
        loadQuestions(activeRound)
      } catch (err) {
        toast.error('Failed to delete question')
      }
    }
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-mono text-2xl font-bold text-volt-text">Question Bank</h2>
          <p className="text-volt-text-muted font-mono text-xs mt-1">
            Manage problems, hidden test cases, starter code, and buggy templates for each round.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg font-mono text-xs font-bold bg-volt-green text-volt-bg hover:bg-volt-green/90 shadow-[0_0_12px_rgba(57,255,20,0.25)] transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Question</span>
        </button>
      </div>

      {/* Round Selection Tabs */}
      <div className="flex items-center gap-2 border-b border-volt-border pb-3">
        {[1, 2, 3].map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setActiveRound(r)}
            className={`px-4 py-2 rounded-lg font-mono text-xs transition-colors flex items-center gap-2 ${
              activeRound === r
                ? 'bg-volt-bg-secondary text-volt-green border border-volt-green/30 shadow-[0_0_10px_rgba(57,255,20,0.15)] font-bold'
                : 'text-volt-text-muted hover:text-volt-text hover:bg-volt-bg-secondary/40'
            }`}
          >
            <span>
              {r === 1 ? 'Round 1 (Replication)' : r === 2 ? 'Round 2 (Debugging)' : 'Round 3 (Scratch)'}
            </span>
          </button>
        ))}
      </div>

      {/* Questions List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="py-12 text-center text-volt-green font-mono text-xs animate-pulse">
            Loading questions for Round {activeRound}...
          </div>
        ) : questions.length === 0 ? (
          <div className="py-12 text-center text-volt-text-muted font-mono text-xs border border-dashed border-volt-border rounded-xl">
            No questions configured for Round {activeRound}. Click "Add Question" to create one.
          </div>
        ) : (
          questions.map((q, idx) => (
            <div
              key={q._id}
              className="p-5 rounded-xl bg-volt-bg-secondary border border-volt-border flex flex-col md:flex-row md:items-start justify-between gap-4 hover:border-volt-border/80 transition-colors"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-volt-bg-tertiary border border-volt-border text-volt-cyan">
                    Q{idx + 1}
                  </span>
                  <h3 className="font-mono text-base font-bold text-volt-text">{q.title}</h3>
                  <span className="font-mono text-xs text-volt-green font-bold ml-auto md:ml-0">
                    {q.totalPoints} pts
                  </span>
                </div>

                <p className="font-mono text-xs text-volt-text-muted line-clamp-2 leading-relaxed">
                  {q.description}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] font-mono text-volt-text-muted">
                  <span>Test Cases: <strong className="text-volt-text">{q.testCases?.length || 0}</strong></span>
                  <span>•</span>
                  <span>Penalty: <strong className="text-volt-red">-{q.penaltyPerWrongSubmission || 0} pts</strong></span>
                  <span>•</span>
                  <span>Time Bonus: <strong className={q.timeBonusEnabled ? 'text-volt-green' : 'text-volt-text-muted'}>{q.timeBonusEnabled ? 'Enabled' : 'Disabled'}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-start">
                <button
                  type="button"
                  onClick={() => openEditModal(q)}
                  className="p-2 rounded bg-volt-bg-tertiary border border-volt-border text-volt-text-muted hover:text-volt-cyan transition-colors"
                  title="Edit Question"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(q)}
                  className="p-2 rounded bg-volt-bg-tertiary border border-volt-border text-volt-text-muted hover:text-volt-red transition-colors"
                  title="Delete Question"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Question Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingQuestion ? `Edit Question: ${editingQuestion.title}` : `Add Question for Round ${activeRound}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs max-h-[75vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-volt-text-muted mb-1 text-[11px] uppercase">Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Star Triangle Pattern"
                className="w-full p-2 rounded bg-volt-bg border border-volt-border text-volt-text focus:outline-none focus:border-volt-green"
              />
            </div>
            <div>
              <label className="block text-volt-text-muted mb-1 text-[11px] uppercase">Total Points *</label>
              <input
                type="number"
                required
                value={formData.totalPoints}
                onChange={(e) => setFormData({ ...formData, totalPoints: Number(e.target.value) })}
                className="w-full p-2 rounded bg-volt-bg border border-volt-border text-volt-text focus:outline-none focus:border-volt-green"
              />
            </div>
          </div>

          <div>
            <label className="block text-volt-text-muted mb-1 text-[11px] uppercase">Description / Problem Statement *</label>
            <textarea
              rows={4}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="State the problem clearly..."
              className="w-full p-2 rounded bg-volt-bg border border-volt-border text-volt-text focus:outline-none focus:border-volt-green resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-volt-text-muted mb-1 text-[11px] uppercase">Input Format</label>
              <input
                type="text"
                value={formData.inputFormat}
                onChange={(e) => setFormData({ ...formData, inputFormat: e.target.value })}
                className="w-full p-2 rounded bg-volt-bg border border-volt-border text-volt-text focus:outline-none focus:border-volt-green"
              />
            </div>
            <div>
              <label className="block text-volt-text-muted mb-1 text-[11px] uppercase">Output Format</label>
              <input
                type="text"
                value={formData.outputFormat}
                onChange={(e) => setFormData({ ...formData, outputFormat: e.target.value })}
                className="w-full p-2 rounded bg-volt-bg border border-volt-border text-volt-text focus:outline-none focus:border-volt-green"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-volt-text-muted mb-1 text-[11px] uppercase">Sample Input</label>
              <textarea
                rows={2}
                value={formData.sampleInput}
                onChange={(e) => setFormData({ ...formData, sampleInput: e.target.value })}
                className="w-full p-2 rounded bg-volt-bg border border-volt-border text-volt-text focus:outline-none focus:border-volt-green resize-none"
              />
            </div>
            <div>
              <label className="block text-volt-text-muted mb-1 text-[11px] uppercase">Sample Output</label>
              <textarea
                rows={2}
                value={formData.sampleOutput}
                onChange={(e) => setFormData({ ...formData, sampleOutput: e.target.value })}
                className="w-full p-2 rounded bg-volt-bg border border-volt-border text-volt-text focus:outline-none focus:border-volt-green resize-none"
              />
            </div>
          </div>

          {/* Round 1 Pattern Display Output */}
          {activeRound === 1 && (
            <div>
              <label className="block text-volt-cyan mb-1 text-[11px] uppercase">
                Expected Console Pattern (Round 1 replication view)
              </label>
              <textarea
                rows={3}
                value={formData.expectedOutput}
                onChange={(e) => setFormData({ ...formData, expectedOutput: e.target.value })}
                placeholder="Exact pattern lines..."
                className="w-full p-2 rounded bg-volt-bg border border-volt-border text-volt-text focus:outline-none focus:border-volt-cyan font-mono resize-none"
              />
            </div>
          )}

          {/* Round 2 Buggy Code per Language */}
          {activeRound === 2 && (
            <div className="space-y-3 p-3 rounded-lg bg-volt-bg-tertiary/40 border border-volt-border">
              <h4 className="text-volt-yellow font-bold uppercase text-[11px]">
                Round 2 Buggy Code (Preloaded in Participant Editor)
              </h4>
              {['python', 'cpp', 'c', 'java'].map((lang) => (
                <div key={lang}>
                  <label className="block text-volt-text-muted mb-0.5 text-[10px] uppercase">{lang}</label>
                  <textarea
                    rows={3}
                    value={formData.buggyCode?.[lang] || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        buggyCode: { ...formData.buggyCode, [lang]: e.target.value },
                      })
                    }
                    placeholder={`Buggy code skeleton in ${lang}...`}
                    className="w-full p-2 rounded bg-volt-bg border border-volt-border text-volt-text focus:outline-none focus:border-volt-yellow font-mono text-[11px] resize-none"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Test Cases Editor */}
          <div className="space-y-3 pt-2 border-t border-volt-border">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-volt-text uppercase text-[11px]">
                Hidden Test Cases ({formData.testCases?.length || 0})
              </h4>
              <button
                type="button"
                onClick={handleAddTestCase}
                className="text-volt-green hover:underline flex items-center gap-1 text-[11px]"
              >
                <Plus className="w-3 h-3" />
                <span>Add Test Case</span>
              </button>
            </div>

            {formData.testCases?.map((tc, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-volt-bg border border-volt-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-volt-text-muted font-bold text-[10px]">Test Case #{idx + 1}</span>
                  {formData.testCases.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTestCase(idx)}
                      className="text-volt-red hover:underline text-[10px]"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-volt-text-muted mb-0.5">Input (stdin)</label>
                    <textarea
                      rows={2}
                      value={tc.input}
                      onChange={(e) => handleTestCaseChange(idx, 'input', e.target.value)}
                      className="w-full p-1.5 rounded bg-volt-bg-secondary border border-volt-border text-volt-text text-[11px] font-mono resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-volt-text-muted mb-0.5">Expected Output *</label>
                    <textarea
                      rows={2}
                      required
                      value={tc.expectedOutput}
                      onChange={(e) => handleTestCaseChange(idx, 'expectedOutput', e.target.value)}
                      className="w-full p-1.5 rounded bg-volt-bg-secondary border border-volt-border text-volt-text text-[11px] font-mono resize-none"
                    />
                  </div>
                </div>
                <div className="w-24">
                  <label className="block text-[10px] text-volt-text-muted mb-0.5">Points</label>
                  <input
                    type="number"
                    value={tc.points || 0}
                    onChange={(e) => handleTestCaseChange(idx, 'points', e.target.value)}
                    className="w-full p-1 rounded bg-volt-bg-secondary border border-volt-border text-volt-text text-[11px] font-mono"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-volt-border">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-3 py-1.5 rounded bg-volt-bg-tertiary border border-volt-border text-volt-text-muted hover:text-volt-text"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-volt-green text-volt-bg font-bold hover:bg-volt-green/90"
            >
              {editingQuestion ? 'Save Changes' : 'Create Question'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
