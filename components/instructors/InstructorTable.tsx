'use client'

import { useRouter } from 'next/navigation'
import type { Instructor } from '@/types'
import { InstructorStatusBadge } from '@/components/ui/StatusBadge'

interface Props {
  instructors: Instructor[]
}

export default function InstructorTable({ instructors }: Props) {
  const router = useRouter()
  if (instructors.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-16 text-center">
        <p className="text-gray-400 text-sm">Aucun moniteur enregistré pour le moment.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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
              Statut
            </th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Inscrit le
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {instructors.map((instructor) => (
            <tr
              key={instructor.id}
              onClick={() => router.push(`/dashboard/instructors/${instructor.id}`)}
              className="hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <td className="px-5 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                {instructor.full_name}
              </td>
              <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">
                {instructor.phone || <span className="text-gray-300">—</span>}
              </td>
              <td className="px-5 py-4 text-sm text-gray-600">
                {instructor.email || <span className="text-gray-300">—</span>}
              </td>
              <td className="px-5 py-4">
                <InstructorStatusBadge status={instructor.status} />
              </td>
              <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">
                {new Date(instructor.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
