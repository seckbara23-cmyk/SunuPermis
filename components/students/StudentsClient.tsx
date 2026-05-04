'use client'

import { useState } from 'react'
import type { Student, UserRole } from '@/types'
import StudentTable from './StudentTable'
import AddStudentModal from './AddStudentModal'

interface DrivingSchoolOption {
  id: string
  name: string
}

interface Props {
  students: Student[]
  canAdd: boolean
  role: UserRole
  drivingSchools: DrivingSchoolOption[]
}

export default function StudentsClient({ students, canAdd, role, drivingSchools }: Props) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Élèves</h1>
          <p className="text-sm text-gray-500 mt-1">
            {students.length} élève{students.length !== 1 ? 's' : ''} enregistré{students.length !== 1 ? 's' : ''}
          </p>
        </div>

        {canAdd && (
          <button
            onClick={() => setModalOpen(true)}
            className="rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 transition-colors"
          >
            + Ajouter un élève
          </button>
        )}
      </div>

      <StudentTable students={students} />

      {modalOpen && (
        <AddStudentModal
          role={role}
          drivingSchools={drivingSchools}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}
