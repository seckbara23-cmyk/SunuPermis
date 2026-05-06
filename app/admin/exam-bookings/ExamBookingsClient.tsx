'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { ExamBookingWithDetails } from '@/types'
import { approveBooking, rejectBooking } from './actions'

const STATUS_BADGE: Record<string, string> = {
  pending:  'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}
const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente', approved: 'Approuvée', rejected: 'Rejetée',
}

interface Props {
  initialBookings: ExamBookingWithDetails[]
}

export default function ExamBookingsClient({ initialBookings }: Props) {
  const router = useRouter()
  const [filter, setFilter]           = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [actionError, setActionError] = useState<string | null>(null)
  const [isPending, startTransition]  = useTransition()

  const visible = filter === 'all' ? initialBookings : initialBookings.filter((b) => b.status === filter)

  function handleApprove(id: string) {
    setActionError(null)
    startTransition(async () => {
      const res = await approveBooking(id)
      if (res.error) setActionError(res.error)
      else router.refresh()
    })
  }

  function handleReject(id: string) {
    setActionError(null)
    startTransition(async () => {
      const res = await rejectBooking(id)
      if (res.error) setActionError(res.error)
      else router.refresh()
    })
  }

  const counts = {
    all:      initialBookings.length,
    pending:  initialBookings.filter((b) => b.status === 'pending').length,
    approved: initialBookings.filter((b) => b.status === 'approved').length,
    rejected: initialBookings.filter((b) => b.status === 'rejected').length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Réservations d&apos;examen</h1>
        <p className="text-sm text-gray-500 mt-1">{counts.pending} en attente d&apos;approbation</p>
      </div>

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{actionError}</div>
      )}

      <div className="flex flex-wrap gap-2">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-navy text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {f === 'all' ? 'Toutes' : STATUS_LABEL[f]} ({counts[f]})
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {visible.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-gray-400">Aucune réservation dans cette catégorie.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr className="bg-gray-50">
                  {['Élève', 'Auto-école', 'Session', 'Statut', 'Demandé le', 'Actions'].map((h) => (
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
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[b.status]}`}>
                        {STATUS_LABEL[b.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(b.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-5 py-4">
                      {b.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApprove(b.id)}
                            disabled={isPending}
                            className="rounded-lg bg-green-50 border border-green-200 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50 transition-colors"
                          >
                            Approuver
                          </button>
                          <button
                            onClick={() => handleReject(b.id)}
                            disabled={isPending}
                            className="rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
                          >
                            Rejeter
                          </button>
                        </div>
                      )}
                      {b.status === 'approved' && (
                        <span className="text-xs text-gray-400">
                          Approuvé {b.approved_at ? new Date(b.approved_at).toLocaleDateString('fr-FR') : ''}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
