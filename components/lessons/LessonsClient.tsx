'use client'

import { useState } from 'react'
import type { LessonWithNames, UserRole } from '@/types'
import LessonTable from './LessonTable'
import AddLessonModal from './AddLessonModal'

interface StudentOption {
  id: string
  full_name: string
}

interface InstructorOption {
  id: string
  full_name: string
}

interface Props {
  lessons: LessonWithNames[]
  canAdd: boolean
  role: UserRole
  students: StudentOption[]
  instructors: InstructorOption[]
}

export default function LessonsClient({ lessons, canAdd, role, students, instructors }: Props) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leçons</h1>
          <p className="text-sm text-gray-500 mt-1">
            {lessons.length} leçon{lessons.length !== 1 ? 's' : ''} enregistrée{lessons.length !== 1 ? 's' : ''}
          </p>
        </div>

        {canAdd && (
          <button
            onClick={() => setModalOpen(true)}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            + Planifier une leçon
          </button>
        )}
      </div>

      <LessonTable lessons={lessons} />

      {modalOpen && (
        <AddLessonModal
          role={role}
          students={students}
          instructors={instructors}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}
