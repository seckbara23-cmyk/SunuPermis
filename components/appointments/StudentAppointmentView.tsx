'use client'

import type { AppointmentWithStudent } from '@/types'
import { AppointmentStatusBadge } from '@/components/ui/StatusBadge'

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface Props {
  appointment: AppointmentWithStudent | null
}

export default function StudentAppointmentView({ appointment }: Props) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mon rendez-vous</h1>
        <p className="text-sm text-gray-500 mt-1">Examen théorique du code de la route</p>
      </div>

      {!appointment ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-16 text-center">
          <p className="text-gray-500 text-sm font-medium">Aucun rendez-vous n&apos;a encore été soumis.</p>
          <p className="text-gray-400 text-xs mt-2 max-w-sm mx-auto">
            Lorsque votre formation sera terminée, votre auto-école soumettra une demande d&apos;examen en votre nom.
          </p>
        </div>
      ) : (
        <div className="max-w-lg bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Statut</span>
            <AppointmentStatusBadge status={appointment.status} />
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div className="flex items-start justify-between">
              <span className="text-sm text-gray-500">Demande soumise le</span>
              <span className="text-sm font-medium text-gray-900 text-right">
                {new Date(appointment.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>

            {appointment.status === 'confirmed' && appointment.scheduled_at && (
              <div className="flex items-start justify-between">
                <span className="text-sm text-gray-500">Date du rendez-vous</span>
                <span className="text-sm font-semibold text-green-700 text-right">
                  {formatDateTime(appointment.scheduled_at)}
                </span>
              </div>
            )}

            {appointment.status === 'rejected' && appointment.rejection_reason && (
              <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3">
                <p className="text-xs font-medium text-red-700 mb-1">Motif du rejet</p>
                <p className="text-sm text-red-600">{appointment.rejection_reason}</p>
              </div>
            )}

            {appointment.status === 'pending' && (
              <p className="text-xs text-gray-400 italic">
                Votre demande est en cours d&apos;examen. Vous serez informé dès qu&apos;une décision est prise.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
