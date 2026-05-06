'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { ExamSession } from '@/types'
import { createExamSession, toggleSessionStatus } from './actions'

interface Props {
  initialSessions: ExamSession[]
}

export default function ExamSessionsClient({ initialSessions }: Props) {
  const router = useRouter()
  const [showModal, setShowModal]     = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isPending, startTransition]  = useTransition()

  const [form, setForm] = useState({ exam_date: '', exam_center: '', available_slots: 10 })

  function handleCreate() {
    setActionError(null)
    startTransition(async () => {
      const res = await createExamSession(form)
      if (res.error) { setActionError(res.error); return }
      setShowModal(false)
      setForm({ exam_date: '', exam_center: '', available_slots: 10 })
      router.refresh()
    })
  }

  function handleToggle(id: string, status: 'open' | 'closed') {
    setActionError(null)
    startTransition(async () => {
      const res = await toggleSessionStatus(id, status)
      if (res.error) setActionError(res.error)
      else router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sessions d&apos;examen</h1>
          <p className="text-sm text-gray-500 mt-1">{initialSessions.length} session{initialSessions.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 transition-colors"
        >
          + Créer une session
        </button>
      </div>

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{actionError}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {initialSessions.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-gray-400">Aucune session d&apos;examen créée.</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50">
                {['Date', 'Centre', 'Places', 'Statut', 'Actions'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {initialSessions.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(s.exam_date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(s.exam_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-900">{s.exam_center}</td>
                  <td className="px-5 py-4 text-sm text-gray-900">{s.available_slots}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      s.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {s.status === 'open' ? 'Ouverte' : 'Fermée'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => handleToggle(s.id, s.status)}
                      disabled={isPending}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      {s.status === 'open' ? 'Fermer' : 'Ouvrir'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Créer une session d&apos;examen</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {actionError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{actionError}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date et heure</label>
                <input
                  type="datetime-local"
                  value={form.exam_date}
                  onChange={(e) => setForm({ ...form, exam_date: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Centre d&apos;examen</label>
                <input
                  type="text"
                  value={form.exam_center}
                  onChange={(e) => setForm({ ...form, exam_center: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
                  placeholder="ex: Centre d'examen de Dakar"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Places disponibles</label>
                <input
                  type="number"
                  min={1}
                  value={form.available_slots}
                  onChange={(e) => setForm({ ...form, available_slots: parseInt(e.target.value) || 1 })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreate}
                  disabled={isPending || !form.exam_date || !form.exam_center.trim()}
                  className="flex-1 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-60 transition-colors"
                >
                  {isPending ? 'Création…' : 'Créer la session'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
