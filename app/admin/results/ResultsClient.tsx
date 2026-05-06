'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { ExamBookingWithDetails } from '@/types'
import { recordResult } from './actions'

interface Props {
  initialBookings: ExamBookingWithDetails[]
}

export default function ResultsClient({ initialBookings }: Props) {
  const router = useRouter()
  const [recordingId, setRecordingId]   = useState<string | null>(null)
  const [selectedResult, setSelected]   = useState<'passed' | 'failed'>('passed')
  const [actionError, setActionError]   = useState<string | null>(null)
  const [isPending, startTransition]    = useTransition()
  const [showHistory, setShowHistory]   = useState(false)

  const pending  = initialBookings.filter((b) => !b.result)
  const graded   = initialBookings.filter((b) => b.result)
  const visible  = showHistory ? graded : pending

  function handleRecord() {
    if (!recordingId) return
    setActionError(null)
    startTransition(async () => {
      const res = await recordResult(recordingId, selectedResult)
      if (res.error) { setActionError(res.error); return }
      setRecordingId(null)
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Résultats d&apos;examen</h1>
          <p className="text-sm text-gray-500 mt-1">{pending.length} résultat{pending.length !== 1 ? 's' : ''} à enregistrer</p>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {showHistory ? 'Résultats en attente' : `Historique (${graded.length})`}
        </button>
      </div>

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{actionError}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {visible.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-gray-400">
            {showHistory ? 'Aucun résultat enregistré.' : 'Aucun examen en attente de résultat.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr className="bg-gray-50">
                  {['Élève', 'Auto-école', 'Session', 'Approuvé le', 'Résultat', ...(showHistory ? [] : ['Action'])].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visible.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-gray-900">{b.students?.full_name}</p>
                      <p className="text-xs text-gray-400">{b.students?.email}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{b.driving_schools?.name}</td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-900">
                        {new Date(b.exam_sessions?.exam_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-xs text-gray-400">{b.exam_sessions?.exam_center}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {b.approved_at ? new Date(b.approved_at).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-5 py-4">
                      {b.result ? (
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          b.result === 'passed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {b.result === 'passed' ? 'Reçu' : 'Échoué'}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">En attente</span>
                      )}
                    </td>
                    {!showHistory && (
                      <td className="px-5 py-4">
                        <button
                          onClick={() => { setRecordingId(b.id); setSelected('passed'); setActionError(null) }}
                          className="rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-white hover:bg-navy/90 transition-colors"
                        >
                          Enregistrer
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {recordingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Enregistrer le résultat</h2>
              <button onClick={() => setRecordingId(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {actionError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{actionError}</div>
              )}
              <p className="text-sm text-gray-600">Sélectionnez le résultat de l&apos;élève à cet examen.</p>
              <div className="flex gap-3">
                {(['passed', 'failed'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setSelected(r)}
                    className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-semibold transition-colors ${
                      selectedResult === r
                        ? r === 'passed' ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {r === 'passed' ? 'Reçu' : 'Échoué'}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setRecordingId(null)}
                  className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleRecord}
                  disabled={isPending}
                  className="flex-1 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-60 transition-colors"
                >
                  {isPending ? 'Enregistrement…' : 'Confirmer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
