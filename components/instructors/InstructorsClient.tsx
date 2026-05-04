'use client'

import { useState } from 'react'
import type { Instructor, UserRole } from '@/types'
import InstructorTable from './InstructorTable'
import AddInstructorModal from './AddInstructorModal'

interface DrivingSchoolOption {
  id: string
  name: string
}

interface Props {
  instructors: Instructor[]
  canAdd: boolean
  role: UserRole
  drivingSchools: DrivingSchoolOption[]
}

export default function InstructorsClient({ instructors, canAdd, role, drivingSchools }: Props) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Moniteurs</h1>
          <p className="text-sm text-gray-500 mt-1">
            {instructors.length} moniteur{instructors.length !== 1 ? 's' : ''} enregistré{instructors.length !== 1 ? 's' : ''}
          </p>
        </div>

        {canAdd && (
          <button
            onClick={() => setModalOpen(true)}
            className="rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 transition-colors"
          >
            + Ajouter un moniteur
          </button>
        )}
      </div>

      <InstructorTable instructors={instructors} />

      {modalOpen && (
        <AddInstructorModal
          role={role}
          drivingSchools={drivingSchools}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}
