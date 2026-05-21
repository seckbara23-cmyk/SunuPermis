'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Student, UserRole } from '@/types'
import StudentTable from './StudentTable'
import AddStudentModal from './AddStudentModal'
import { Pagination } from '@/components/ui/Pagination'

interface DrivingSchoolOption {
  id: string
  name: string
}

interface Props {
  students: Student[]
  canAdd: boolean
  role: UserRole
  drivingSchools: DrivingSchoolOption[]
  total?: number
  page?: number
  pageSize?: number
  basePath?: string
  accountStatusFilter?: string
}

const STATUS_FILTER_OPTIONS = [
  { value: 'active',    label: 'Actifs'     },
  { value: 'all',       label: 'Tous'       },
  { value: 'suspended', label: 'Suspendus'  },
  { value: 'archived',  label: 'Archivés'   },
]

export default function StudentsClient({
  students,
  canAdd,
  role,
  drivingSchools,
  total,
  page = 1,
  pageSize = 20,
  basePath = '/dashboard/students',
  accountStatusFilter = 'active',
}: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const router = useRouter()
  const displayTotal = total ?? students.length

  function handleFilterChange(value: string) {
    const params = new URLSearchParams()
    params.set('account_status', value)
    params.set('page', '1')
    router.push(`${basePath}?${params.toString()}`)
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Élèves</h1>
          <p className="text-sm text-gray-500 mt-1">
            {displayTotal} élève{displayTotal !== 1 ? 's' : ''}
            {accountStatusFilter === 'active' && ' actifs'}
            {accountStatusFilter === 'suspended' && ' suspendus'}
            {accountStatusFilter === 'archived' && ' archivés'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Account status filter tabs */}
          <div className="flex rounded-lg border border-gray-200 bg-white overflow-hidden">
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleFilterChange(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors border-r border-gray-200 last:border-0 ${
                  accountStatusFilter === opt.value
                    ? 'bg-navy text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
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
      </div>

      <StudentTable students={students} />
      {total !== undefined && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          basePath={basePath}
          searchParams={{ account_status: accountStatusFilter }}
        />
      )}

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
