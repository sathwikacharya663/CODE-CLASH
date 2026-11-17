import { useEffect, useRef, useState } from 'react'
import { autoSave } from '../api/participant.js'

export function useAutoSave({ code, language, questionId }) {
  const lastSavedRef = useRef('')
  const [saveStatus, setSaveStatus] = useState(null) // 'saving' | 'saved' | null

  useEffect(() => {
    if (!questionId) return
    const interval = setInterval(async () => {
      if (code !== lastSavedRef.current && code.trim()) {
        setSaveStatus('saving')
        try {
          await autoSave({ code, language, questionId })
          lastSavedRef.current = code
          setSaveStatus('saved')
          setTimeout(() => setSaveStatus(null), 2000)
        } catch {
          setSaveStatus(null)
        }
      }
    }, 10000)
    return () => clearInterval(interval)
  }, [code, language, questionId])

  return { saveStatus }
}
