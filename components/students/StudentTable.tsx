'use client'

import { useRouter } from 'next/navigation'
import type { Student } from '@/types'
import { TrainingStatusBadge, PaymentStatusBadge, AccountStatusBadge } from '@/components/ui/StatusBadge'

interface Props {
  students: Student[]
}

export default function StudentTable({ students }: Props) {
  const router = useRouter()

  if (students.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-16 text-center">
        <p className="text-gray-400 text-sm">Aucun élève trouvé.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-100">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Nom complet
            </th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Téléphone
            </th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Email
            </th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Catégorie
            </th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Compte
            </th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Formation
            </th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Paiement
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {students.map((student) => (
            <tr
              key={student.id}
              onClick={() => router.push(`/dashboard/students/${student.id}`)}
              className={`transition-colors cursor-pointer ${
                student.account_status === 'archived'
                  ? 'opacity-50 hover:opacity-70 hover:bg-gray-50'
                  : student.account_status === 'suspended'
                    ? 'bg-orange-50/40 hover:bg-orange-50'
                    : 'hover:bg-blue-50'
              }`}
            >
              <td className="px-5 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                {student.full_name}
              </td>
              <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">
                {student.phone || <span className="text-gray-300">—</span>}
              </td>
              <td className="px-5 py-4 text-sm text-gray-600">
                {student.email || <span className="text-gray-300">—</span>}
              </td>
              <td className="px-5 py-4 text-sm font-medium text-gray-900 text-center">
                {student.license_category}
              </td>
              <td className="px-5 py-4">
                <AccountStatusBadge status={student.account_status} />
              </td>
              <td className="px-5 py-4">
                <TrainingStatusBadge status={student.training_status} />
              </td>
              <td className="px-5 py-4">
                <PaymentStatusBadge status={student.payment_status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  )
}
