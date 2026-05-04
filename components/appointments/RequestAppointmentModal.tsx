'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { requestAppointment } from '@/app/dashboard/appointments/actions'

interface StudentOption {
  id: string
  full_name: string
}

interface Props {
  eligibleStudents: StudentOption[]
  onClose: () => void
}

export default function RequestAppointmentModal({ eligibleStudents, onClose }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const selectRef = useRef<HTMLSelectElement>(null)

  useEffect(() => {
    selectRef.current?.focus()
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const data = new FormData(e.currentTarget)
    const studentId = data.get('student_id') as string

    const result = await requestAppointment(studentId)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.refresh()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Demander un rendez-vous</h2>
            <p className="text-xs text-gray-400 mt-0.5">Uniquement les élèves prêts pour l&apos;examen</p>
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

          {eligibleStudents.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              Aucun élève éligible. Les élèves doivent avoir le statut{' '}
              <span className="font-medium">Prêt pour l&apos;examen</span>.
            </p>
          ) : (
            <div>
              <label htmlFor="student_id" className="block text-sm font-medium text-gray-700 mb-1">
                Élève <span className="text-red-500">*</span>
              </label>
              <select
                ref={selectRef}
                id="student_id"
                name="student_id"
                required
                defaultValue=""
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent bg-white"
              >
                <option value="" disabled>Sélectionner un élève</option>
                {eligibleStudents.map((s) => (
                  <option key={s.id} value={s.id}>{s.full_name}</option>
                ))}
              </select>
            </div>
          )}

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
              disabled={loading || eligibleStudents.length === 0}
              className="flex-1 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Envoi...' : 'Soumettre la demande'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
