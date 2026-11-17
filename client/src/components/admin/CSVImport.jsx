import React, { useState } from 'react'
import { Upload, FileSpreadsheet, Download, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../common/Modal.jsx'
import { bulkImportTeams } from '../../api/admin.js'

export default function CSVImport({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)

  const handleDownloadSample = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,teamName,member1,member2,member3\n' +
      'CyberKnights,Alice Parker,Bob Vance,Charlie Chaplin\n' +
      'KernelPanic,David Copperfield,Eve Adams,\n' +
      'ByteBandits,Frank Sinatra,Grace Kelly,Henry Cavill\n'

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'sample_teams_import.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) {
      toast.error('Please select a CSV file first')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      setImporting(true)
      setResult(null)
      const res = await bulkImportTeams(formData)
      setResult(res.data)
      toast.success(`Successfully imported ${res.data.count || 0} teams!`)
      if (onSuccess) onSuccess()
    } catch (err) {
      toast.error(err.response?.data?.message || 'CSV Import failed')
    } finally {
      setImporting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bulk Import Teams (CSV)">
      <div className="space-y-4 font-mono text-xs">
        <p className="text-volt-text-muted leading-relaxed">
          Upload a CSV file containing team records. The server will auto-generate secure passwords and unique IDs (e.g. TEAM001).
        </p>

        {/* Sample Download Pill */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-volt-bg border border-volt-border">
          <div className="flex items-center gap-2 text-volt-text">
            <FileSpreadsheet className="w-4 h-4 text-volt-cyan" />
            <span className="text-[11px]">Columns: teamName, member1, member2, member3</span>
          </div>
          <button
            type="button"
            onClick={handleDownloadSample}
            className="flex items-center gap-1 text-[11px] text-volt-cyan hover:underline"
          >
            <Download className="w-3 h-3" />
            <span>Sample CSV</span>
          </button>
        </div>

        {/* File Picker */}
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="border-2 border-dashed border-volt-border rounded-xl p-6 text-center hover:border-volt-green/50 transition-colors">
            <input
              type="file"
              id="csvFileInput"
              accept=".csv"
              onChange={(e) => setFile(e.target.files[0] || null)}
              className="hidden"
            />
            <label htmlFor="csvFileInput" className="cursor-pointer flex flex-col items-center">
              <Upload className="w-8 h-8 text-volt-text-muted mb-2 animate-bounce" />
              <span className="text-volt-text font-semibold mb-1">
                {file ? file.name : 'Click to select CSV file'}
              </span>
              <span className="text-[10px] text-volt-text-muted">Accepts .csv format</span>
            </label>
          </div>

          {/* Results Summary */}
          {result && (
            <div className="p-3 rounded-lg bg-volt-green/10 border border-volt-green/30 text-volt-green space-y-2 max-h-40 overflow-y-auto">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle className="w-4 h-4" />
                <span>Imported {result.count} teams successfully:</span>
              </div>
              <ul className="text-[11px] list-disc list-inside space-y-0.5">
                {result.created?.map((t) => (
                  <li key={t.teamId}>
                    <span className="font-bold">{t.teamId}</span>: {t.teamName} (Password: {t.password})
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-volt-border">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded bg-volt-bg-tertiary border border-volt-border text-volt-text-muted hover:text-volt-text"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={!file || importing}
              className="px-4 py-1.5 rounded bg-volt-green text-volt-bg font-bold hover:bg-volt-green/90 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{importing ? 'Importing...' : 'Upload & Generate Credentials'}</span>
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
