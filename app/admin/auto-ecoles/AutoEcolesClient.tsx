'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { DrivingSchool } from '@/types'
import { approveSchool, rejectSchool, toggleSchoolStatus } from './actions'

const APPROVAL_BADGE: Record<string, string> = {
  pending:  'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}
const APPROVAL_LABEL: Record<string, string> = {
  pending: 'En attente', approved: 'Approuvée', rejected: 'Rejetée',
}
const STATUS_BADGE: Record<string, string> = {
  active:   'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
}

interface Props {
  initialSchools: DrivingSchool[]
}

export default function AutoEcolesClient({ initialSchools }: Props) {
  const router = useRouter()
  const [rejectId, setRejectId]         = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionError, setActionError]   = useState<string | null>(null)
  const [isPending, startTransition]    = useTransition()

  function handleApprove(id: string) {
    setActionError(null)
    startTransition(async () => {
      const res = await approveSchool(id)
      if (res.error) setActionError(res.error)
      else router.refresh()
    })
  }

  function handleRejectConfirm() {
    if (!rejectId) return
    setActionError(null)
    startTransition(async () => {
      const res = await rejectSchool(rejectId, rejectReason)
      if (res.error) { setActionError(res.error); return }
      setRejectId(null); setRejectReason('')
      router.refresh()
    })
  }

  function handleToggle(id: string, status: 'active' | 'inactive') {
    setActionError(null)
    startTransition(async () => {
      const res = await toggleSchoolStatus(id, status)
      if (res.error) setActionError(res.error)
      else router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Auto-écoles</h1>
          <p className="text-sm text-gray-500 mt-1">{initialSchools.length} auto-école{initialSchools.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{actionError}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {initialSchools.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-gray-400">Aucune auto-école enregistrée.</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50">
                {['Nom', 'Email', 'Téléphone', 'Approbation', 'Statut', 'Actions'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {initialSchools.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.address}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">{s.email || '—'}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{s.phone || '—'}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${APPROVAL_BADGE[s.approval_status ?? 'pending']}`}>
                      {APPROVAL_LABEL[s.approval_status ?? 'pending']}
                    </span>
                    {s.rejection_reason && (
                      <p className="text-xs text-red-500 mt-1 max-w-[180px] truncate">{s.rejection_reason}</p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[s.status]}`}>
                      {s.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      {s.approval_status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(s.id)}
                            disabled={isPending}
                            className="rounded-lg bg-green-50 border border-green-200 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50 transition-colors"
                          >
                            Approuver
                          </button>
                          <button
                            onClick={() => { setRejectId(s.id); setRejectReason('') }}
                            disabled={isPending}
                            className="rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
                          >
                            Rejeter
                          </button>
                        </>
                      )}
                      {s.approval_status === 'approved' && (
                        <button
                          onClick={() => handleToggle(s.id, s.status)}
                          disabled={isPending}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                          {s.status === 'active' ? 'Suspendre' : 'Activer'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Rejeter l&apos;auto-école</h2>
              <button onClick={() => setRejectId(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {actionError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{actionError}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Raison du rejet</label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent resize-none"
                  placeholder="Expliquez la raison du rejet…"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setRejectId(null)}
                  className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleRejectConfirm}
                  disabled={isPending || !rejectReason.trim()}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
                >
                  {isPending ? 'En cours…' : 'Confirmer le rejet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
