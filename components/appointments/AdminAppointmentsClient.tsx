'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AppointmentWithDetails } from '@/types'
import { cancelAppointment } from '@/app/dashboard/appointments/actions'
import AdminAppointmentTable from './AdminAppointmentTable'
import ConfirmAppointmentModal from './ConfirmAppointmentModal'
import RejectAppointmentModal from './RejectAppointmentModal'

interface Props {
  appointments: AppointmentWithDetails[]
}

export default function AdminAppointmentsClient({ appointments }: Props) {
  const router = useRouter()
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<AppointmentWithDetails | null>(null)
  const [rejectTarget, setRejectTarget] = useState<AppointmentWithDetails | null>(null)

  async function handleCancel(id: string) {
    setProcessingId(id)
    await cancelAppointment(id)
    router.refresh()
    setProcessingId(null)
  }

  const pending   = appointments.filter((a) => a.status === 'pending').length
  const confirmed = appointments.filter((a) => a.status === 'confirmed').length

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des rendez-vous</h1>
        <p className="text-sm text-gray-500 mt-1">
          {appointments.length} demande{appointments.length !== 1 ? 's' : ''}
          {' — '}
          <span className="text-yellow-600">{pending} en attente</span>
          {' · '}
          <span className="text-green-600">{confirmed} confirmée{confirmed !== 1 ? 's' : ''}</span>
        </p>
      </div>

      <AdminAppointmentTable
        appointments={appointments}
        processingId={processingId}
        onConfirm={setConfirmTarget}
        onReject={setRejectTarget}
        onCancel={handleCancel}
      />

      {confirmTarget && (
        <ConfirmAppointmentModal
          appointmentId={confirmTarget.id}
          currentScheduledAt={confirmTarget.scheduled_at}
          onClose={() => setConfirmTarget(null)}
          onSuccess={() => {
            setConfirmTarget(null)
            router.refresh()
          }}
        />
      )}

      {rejectTarget && (
        <RejectAppointmentModal
          appointmentId={rejectTarget.id}
          studentName={rejectTarget.students.full_name}
          onClose={() => setRejectTarget(null)}
          onSuccess={() => {
            setRejectTarget(null)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
