'use client'

import { useState, useEffect } from 'react'
import { confirmAppointment } from '@/app/dashboard/appointments/actions'

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Date(iso).toISOString().slice(0, 16)
}

interface Props {
  appointmentId: string
  currentScheduledAt?: string | null
  onClose: () => void
  onSuccess: () => void
}

export default function ConfirmAppointmentModal({
  appointmentId,
  currentScheduledAt,
  onClose,
  onSuccess,
}: Props) {
  const [scheduledAt, setScheduledAt] = useState(toDatetimeLocal(currentScheduledAt))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!currentScheduledAt

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!scheduledAt) {
      setError('La date du rendez-vous est obligatoire.')
      return
    }
    setLoading(true)
    setError(null)

    const result = await confirmAppointment(appointmentId, scheduledAt)

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
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Modifier la date' : 'Confirmer le rendez-vous'}
          </h2>
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
            <label htmlFor="scheduled_at" className="block text-sm font-medium text-gray-700 mb-1">
              Date et heure du rendez-vous <span className="text-red-500">*</span>
            </label>
            <input
              id="scheduled_at"
              type="datetime-local"
              required
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              disabled={loading || !scheduledAt}
              className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '...' : isEdit ? 'Enregistrer' : 'Confirmer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
