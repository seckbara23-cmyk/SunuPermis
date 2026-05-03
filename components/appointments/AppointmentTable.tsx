'use client'

import type { AppointmentWithStudent } from '@/types'
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
  appointments: AppointmentWithStudent[]
}

export default function AppointmentTable({ appointments }: Props) {
  if (appointments.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-16 text-center">
        <p className="text-gray-400 text-sm">Aucune demande de rendez-vous pour le moment.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-100">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Élève</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Demande</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date RDV</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Remarque</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {appointments.map((apt) => (
            <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-5 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                {apt.students.full_name}
              </td>
              <td className="px-5 py-4">
                <AppointmentStatusBadge status={apt.status} />
              </td>
              <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">
                {formatDate(apt.created_at)}
              </td>
              <td className="px-5 py-4 text-sm text-gray-700 whitespace-nowrap">
                {apt.status === 'confirmed' && apt.scheduled_at
                  ? <span className="font-medium text-green-700">{formatDateTime(apt.scheduled_at)}</span>
                  : <span className="text-gray-300">—</span>
                }
              </td>
              <td className="px-5 py-4 text-sm text-gray-500 max-w-xs">
                {apt.status === 'rejected' && apt.rejection_reason
                  ? <span className="text-red-500 truncate block">{apt.rejection_reason}</span>
                  : <span className="text-gray-300">—</span>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
