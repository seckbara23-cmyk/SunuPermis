'use client'

import { useRouter } from 'next/navigation'
import type { LessonWithNames } from '@/types'
import { LessonStatusBadge } from '@/components/ui/StatusBadge'

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface Props {
  lessons: LessonWithNames[]
}

export default function LessonTable({ lessons }: Props) {
  const router = useRouter()

  if (lessons.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-16 text-center">
        <p className="text-gray-400 text-sm">Aucune leçon planifiée pour le moment.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-100">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Élève
            </th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Moniteur
            </th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Début
            </th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Fin
            </th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Statut
            </th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Notes
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {lessons.map((lesson) => (
            <tr
              key={lesson.id}
              onClick={() => router.push(`/dashboard/lessons/${lesson.id}`)}
              className="hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <td className="px-5 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                {lesson.students.full_name}
              </td>
              <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">
                {lesson.instructors.full_name}
              </td>
              <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">
                {formatDateTime(lesson.start_time)}
              </td>
              <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">
                {formatDateTime(lesson.end_time)}
              </td>
              <td className="px-5 py-4">
                <LessonStatusBadge status={lesson.status} />
              </td>
              <td className="px-5 py-4 text-sm text-gray-500 max-w-xs truncate">
                {lesson.notes || <span className="text-gray-300">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
