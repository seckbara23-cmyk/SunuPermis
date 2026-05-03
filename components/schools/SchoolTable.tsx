'use client'

import type { DrivingSchool } from '@/types'
import { ApprovalStatusBadge } from '@/components/ui/StatusBadge'

interface Props {
  schools: DrivingSchool[]
  approvingId: string | null
  onApprove: (id: string) => void
  onRejectClick: (school: { id: string; name: string }) => void
}

export default function SchoolTable({ schools, approvingId, onApprove, onRejectClick }: Props) {
  if (schools.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-16 text-center">
        <p className="text-gray-400 text-sm">Aucune auto-école enregistrée pour le moment.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-100">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Nom
            </th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Adresse
            </th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Téléphone
            </th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Email
            </th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Statut
            </th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Inscription
            </th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {schools.map((school) => (
            <tr key={school.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-5 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                {school.name}
              </td>
              <td className="px-5 py-4 text-sm text-gray-600 max-w-xs truncate">
                {school.address}
              </td>
              <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">
                {school.phone || <span className="text-gray-300">—</span>}
              </td>
              <td className="px-5 py-4 text-sm text-gray-600">
                {school.email || <span className="text-gray-300">—</span>}
              </td>
              <td className="px-5 py-4">
                <div className="flex flex-col gap-1">
                  <ApprovalStatusBadge status={school.approval_status} />
                  {school.approval_status === 'rejected' && school.rejection_reason && (
                    <p className="text-xs text-red-500 max-w-[160px] truncate" title={school.rejection_reason}>
                      {school.rejection_reason}
                    </p>
                  )}
                </div>
              </td>
              <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">
                {new Date(school.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </td>
              <td className="px-5 py-4">
                <Actions
                  school={school}
                  approving={approvingId === school.id}
                  onApprove={onApprove}
                  onRejectClick={onRejectClick}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface ActionsProps {
  school: DrivingSchool
  approving: boolean
  onApprove: (id: string) => void
  onRejectClick: (school: { id: string; name: string }) => void
}

function Actions({ school, approving, onApprove, onRejectClick }: ActionsProps) {
  if (school.approval_status === 'approved') return null

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onApprove(school.id)}
        disabled={approving}
        className="rounded-lg bg-green-50 border border-green-200 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {approving ? '...' : 'Approuver'}
      </button>

      {school.approval_status === 'pending' && (
        <button
          onClick={() => onRejectClick({ id: school.id, name: school.name })}
          disabled={approving}
          className="rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Rejeter
        </button>
      )}
    </div>
  )
}
