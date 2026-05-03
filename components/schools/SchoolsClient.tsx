'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { DrivingSchool } from '@/types'
import { approveSchool } from '@/app/dashboard/schools/actions'
import SchoolTable from './SchoolTable'
import RejectSchoolModal from './RejectSchoolModal'

interface Props {
  schools: DrivingSchool[]
}

export default function SchoolsClient({ schools }: Props) {
  const router = useRouter()
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [rejectTarget, setRejectTarget] = useState<{ id: string; name: string } | null>(null)

  async function handleApprove(id: string) {
    setApprovingId(id)
    await approveSchool(id)
    router.refresh()
    setApprovingId(null)
  }

  const pending  = schools.filter((s) => s.approval_status === 'pending').length
  const approved = schools.filter((s) => s.approval_status === 'approved').length
  const rejected = schools.filter((s) => s.approval_status === 'rejected').length

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Auto-écoles</h1>
        <p className="text-sm text-gray-500 mt-1">
          {schools.length} au total —{' '}
          <span className="text-yellow-600">{pending} en attente</span>
          {' · '}
          <span className="text-green-600">{approved} approuvée{approved !== 1 ? 's' : ''}</span>
          {' · '}
          <span className="text-red-600">{rejected} rejetée{rejected !== 1 ? 's' : ''}</span>
        </p>
      </div>

      <SchoolTable
        schools={schools}
        approvingId={approvingId}
        onApprove={handleApprove}
        onRejectClick={setRejectTarget}
      />

      {rejectTarget && (
        <RejectSchoolModal
          schoolId={rejectTarget.id}
          schoolName={rejectTarget.name}
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
