'use client'

import Link from 'next/link'
import type { AppointmentWithDetails } from '@/types'
import { AppointmentStatusBadge } from '@/components/ui/StatusBadge'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface Props {
  appointments: AppointmentWithDetails[]
  processingId: string | null
  onConfirm: (apt: AppointmentWithDetails) => void
  onReject: (apt: AppointmentWithDetails) => void
  onCancel: (id: string) => void
}

export default function AdminAppointmentTable({
  appointments,
  processingId,
  onConfirm,
  onReject,
  onCancel,
}: Props) {
  if (appointments.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-16 text-center">
        <p className="text-gray-400 text-sm">Aucune demande de rendez-vous reçue.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-100">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Auto-école</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Élève</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Demande</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date RDV</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Réf. convocation</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {appointments.map((apt) => {
            const busy = processingId === apt.id
            return (
              <tr key={apt.id} className="hover:bg-gray-50 transition-colors align-top">
                <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">
                  {apt.driving_schools.name}
                </td>
                <td className="px-5 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                  {apt.students.full_name}
                </td>
                <td className="px-5 py-4">
                  <div className="space-y-1">
                    <AppointmentStatusBadge status={apt.status} />
                    {apt.status === 'rejected' && apt.rejection_reason && (
                      <p className="text-xs text-red-500 max-w-[160px] truncate" title={apt.rejection_reason}>
                        {apt.rejection_reason}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">
                  {formatDate(apt.created_at)}
                </td>
                <td className="px-5 py-4 text-sm whitespace-nowrap">
                  {apt.status === 'confirmed' && apt.scheduled_at
                    ? <span className="font-medium text-green-700">{formatDateTime(apt.scheduled_at)}</span>
                    : <span className="text-gray-300">—</span>
                  }
                </td>
                <td className="px-5 py-4 text-sm whitespace-nowrap">
                  {apt.status === 'confirmed' && apt.confirmation_reference ? (
                    <div className="space-y-1">
                      <span className="font-mono text-xs font-bold text-navy tracking-wide">
                        {apt.confirmation_reference}
                      </span>
                      <div>
                        <Link
                          href={`/admin/reservations/${apt.id}/confirmation`}
                          className="text-xs text-navy hover:underline"
                        >
                          Voir la convocation →
                        </Link>
                      </div>
                    </div>
                  ) : apt.status === 'confirmed' ? (
                    <span className="text-xs text-gray-400 italic">En cours…</span>
                  ) : (
                    <span className="text-xs text-gray-300">Non générée</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <RowActions
                    apt={apt}
                    busy={busy}
                    onConfirm={onConfirm}
                    onReject={onReject}
                    onCancel={onCancel}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      </div>
    </div>
  )
}

interface RowActionsProps {
  apt: AppointmentWithDetails
  busy: boolean
  onConfirm: (apt: AppointmentWithDetails) => void
  onReject: (apt: AppointmentWithDetails) => void
  onCancel: (id: string) => void
}

function RowActions({ apt, busy, onConfirm, onReject, onCancel }: RowActionsProps) {
  if (apt.status === 'cancelled' || apt.status === 'rejected') return null

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {(apt.status === 'pending' || apt.status === 'confirmed') && (
        <button
          onClick={() => onConfirm(apt)}
          disabled={busy}
          className="rounded-lg bg-green-50 border border-green-200 px-2.5 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50 transition-colors"
        >
          {apt.status === 'confirmed' ? 'Modifier' : 'Confirmer'}
        </button>
      )}

      {apt.status === 'pending' && (
        <button
          onClick={() => onReject(apt)}
          disabled={busy}
          className="rounded-lg bg-red-50 border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
        >
          Rejeter
        </button>
      )}

      <button
        onClick={() => onCancel(apt.id)}
        disabled={busy}
        className="rounded-lg bg-gray-50 border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
      >
        {busy ? '...' : 'Annuler'}
      </button>
    </div>
  )
}
