'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { AppointmentWithDetails } from '@/types'
import { cancelAppointment } from '@/app/dashboard/appointments/actions'
import AdminAppointmentTable from './AdminAppointmentTable'
import ConfirmAppointmentModal from './ConfirmAppointmentModal'
import RejectAppointmentModal from './RejectAppointmentModal'

type FilterValue = 'pending' | 'confirmed' | 'rejected' | 'all'

const FILTER_TABS: { value: FilterValue; label: string }[] = [
  { value: 'pending',   label: 'En attente' },
  { value: 'confirmed', label: 'Validés'    },
  { value: 'rejected',  label: 'Rejetés'    },
  { value: 'all',       label: 'Tous'       },
]

interface Props {
  appointments: AppointmentWithDetails[]
  activeFilter?: string
}

export default function AdminAppointmentsClient({
  appointments,
  activeFilter = 'pending',
}: Props) {
  const router = useRouter()
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<AppointmentWithDetails | null>(null)
  const [rejectTarget, setRejectTarget]   = useState<AppointmentWithDetails | null>(null)

  async function handleCancel(id: string) {
    setProcessingId(id)
    await cancelAppointment(id)
    router.refresh()
    setProcessingId(null)
  }

  // Counts for tab badges
  const counts: Record<FilterValue, number> = {
    pending:   appointments.filter((a) => a.status === 'pending').length,
    confirmed: appointments.filter((a) => a.status === 'confirmed').length,
    rejected:  appointments.filter((a) => a.status === 'rejected').length,
    all:       appointments.length,
  }

  // Client-side filter
  const displayed =
    activeFilter === 'all'
      ? appointments
      : appointments.filter((a) => a.status === activeFilter)

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des rendez-vous</h1>
        <p className="text-sm text-gray-500 mt-1">
          {appointments.length} demande{appointments.length !== 1 ? 's' : ''} au total
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-200">
        {FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab.value
          const count = counts[tab.value]
          return (
            <Link
              key={tab.value}
              href={`/admin/reservations?status=${tab.value}`}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                isActive
                  ? 'border-navy text-navy'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${
                  isActive ? 'bg-navy text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {count}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      <AdminAppointmentTable
        appointments={displayed}
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
          onSuccess={() => { setConfirmTarget(null); router.refresh() }}
        />
      )}

      {rejectTarget && (
        <RejectAppointmentModal
          appointmentId={rejectTarget.id}
          studentName={rejectTarget.students.full_name}
          onClose={() => setRejectTarget(null)}
          onSuccess={() => { setRejectTarget(null); router.refresh() }}
        />
      )}
    </div>
  )
}
