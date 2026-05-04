'use client'

import { useState, useTransition } from 'react'
import type { ExamSession, ExamBookingWithDetails, Student } from '@/types'
import { requestExamBooking } from './booking-actions'

const BOOKING_BADGE: Record<string, string> = {
  pending:  'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}
const BOOKING_LABEL: Record<string, string> = {
  pending: 'En attente', approved: 'Approuvée', rejected: 'Rejetée',
}

interface Props {
  sessions:      ExamSession[]
  bookings:      ExamBookingWithDetails[]
  readyStudents: Pick<Student, 'id' | 'full_name' | 'training_status'>[]
}

export default function ExamBookingClient({ sessions, bookings, readyStudents }: Props) {
  const [showModal, setShowModal]     = useState(false)
  const [selectedSession, setSession] = useState('')
  const [selectedStudent, setStudent] = useState('')
  const [formError, setFormError]     = useState<string | null>(null)
  const [isPending, startTransition]  = useTransition()

  function handleRequest() {
    if (!selectedSession || !selectedStudent) {
      setFormError('Sélectionnez un élève et une session.')
      return
    }
    setFormError(null)
    startTransition(async () => {
      const res = await requestExamBooking(selectedStudent, selectedSession)
      if (res.error) { setFormError(res.error); return }
      setShowModal(false)
      setSession('')
      setStudent('')
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Examens</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sessions disponibles et réservations de votre auto-école
          </p>
        </div>
        {readyStudents.length > 0 && sessions.length > 0 && (
          <button
            onClick={() => setShowModal(true)}
            className="rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 transition-colors"
          >
            + Demander une réservation
          </button>
        )}
      </div>

      {/* Upcoming sessions */}
      <div>
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
          Sessions ouvertes ({sessions.length})
        </h2>
        {sessions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-10 text-center">
            <p className="text-sm text-gray-400">Aucune session d&apos;examen ouverte pour le moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sessions.map((s) => (
              <div key={s.id} className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(s.exam_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.exam_center}</p>
                  </div>
                  <span className="text-xs font-medium text-navy bg-navy/10 rounded-full px-2.5 py-1 shrink-0">
                    {new Date(s.exam_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  {s.available_slots} place{s.available_slots !== 1 ? 's' : ''} disponible{s.available_slots !== 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bookings */}
      <div>
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
          Mes réservations ({bookings.length})
        </h2>
        {bookings.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-10 text-center">
            <p className="text-sm text-gray-400">Aucune réservation effectuée.</p>
            {readyStudents.length > 0 && sessions.length > 0 && (
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90 transition-colors"
              >
                Demander une réservation
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr className="bg-gray-50">
                  {['Élève', 'Session', 'Statut', 'Résultat', 'Demandé le'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 text-sm font-medium text-gray-900">{b.students?.full_name}</td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-900">
                        {new Date(b.exam_sessions?.exam_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-xs text-gray-400">{b.exam_sessions?.exam_center}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${BOOKING_BADGE[b.status]}`}>
                        {BOOKING_LABEL[b.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {b.result ? (
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          b.result === 'passed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {b.result === 'passed' ? 'Reçu' : 'Échoué'}
                        </span>
                      ) : <span className="text-xs text-gray-400">—</span>}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(b.created_at).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Request booking modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Demander une réservation</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{formError}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Élève (prêt pour l&apos;examen)</label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setStudent(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent bg-white"
                >
                  <option value="">Sélectionner un élève…</option>
                  {readyStudents.map((s) => (
                    <option key={s.id} value={s.id}>{s.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Session d&apos;examen</label>
                <select
                  value={selectedSession}
                  onChange={(e) => setSession(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent bg-white"
                >
                  <option value="">Sélectionner une session…</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {new Date(s.exam_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} — {s.exam_center}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleRequest}
                  disabled={isPending}
                  className="flex-1 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-60 transition-colors"
                >
                  {isPending ? 'Envoi…' : 'Demander'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
