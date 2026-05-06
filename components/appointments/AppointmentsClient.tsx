'use client'

import { useState } from 'react'
import type { AppointmentWithStudent } from '@/types'
import AppointmentTable from './AppointmentTable'
import RequestAppointmentModal from './RequestAppointmentModal'

interface StudentOption {
  id: string
  full_name: string
}

interface Props {
  appointments: AppointmentWithStudent[]
  eligibleStudents: StudentOption[]
}

export default function AppointmentsClient({ appointments, eligibleStudents }: Props) {
  const [modalOpen, setModalOpen] = useState(false)

  const pending = appointments.filter((a) => a.status === 'pending').length

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rendez-vous</h1>
          <p className="text-sm text-gray-500 mt-1">
            {appointments.length} demande{appointments.length !== 1 ? 's' : ''}
            {pending > 0 && (
              <span className="text-yellow-600"> — {pending} en attente</span>
            )}
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 transition-colors"
        >
          + Demander un rendez-vous
        </button>
      </div>

      <AppointmentTable appointments={appointments} />

      {modalOpen && (
        <RequestAppointmentModal
          eligibleStudents={eligibleStudents}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}
