'use client'

import { useState, useRef, useEffect } from 'react'
import { rejectAppointment } from '@/app/dashboard/appointments/actions'

interface Props {
  appointmentId: string
  studentName: string
  onClose: () => void
  onSuccess: () => void
}

export default function RejectAppointmentModal({ appointmentId, studentName, onClose, onSuccess }: Props) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason.trim()) {
      setError('La raison du rejet est obligatoire.')
      return
    }
    setLoading(true)
    setError(null)

    const result = await rejectAppointment(appointmentId, reason.trim())

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    onSuccess()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Rejeter la demande</h2>
            <p className="text-sm text-gray-500 mt-0.5">{studentName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
              Raison du rejet <span className="text-red-500">*</span>
            </label>
            <textarea
              ref={textareaRef}
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              required
              placeholder="Expliquez pourquoi cette demande est rejetée..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !reason.trim()}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '...' : 'Confirmer le rejet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
