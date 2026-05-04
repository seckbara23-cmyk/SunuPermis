'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { LessonWithNames, LessonStatus } from '@/types'
import { updateLessonStatus } from '@/app/dashboard/lessons/actions'
import { LessonStatusBadge } from '@/components/ui/StatusBadge'
import { LESSON_STATUS_OPTIONS } from '@/lib/formatters'

interface InfoRowProps {
  label: string
  value: React.ReactNode
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 shrink-0 w-40">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right">{value}</span>
    </div>
  )
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface Props {
  lesson: LessonWithNames
  canUpdate: boolean
}

export default function LessonDetail({ lesson, canUpdate }: Props) {
  const [status, setStatus] = useState<LessonStatus>(lesson.status)
  const [selected, setSelected] = useState<LessonStatus>(lesson.status)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => setSuccess(false), 3000)
    return () => clearTimeout(t)
  }, [success])

  async function handleUpdate() {
    if (selected === status) return
    setLoading(true)
    setError(null)
    setSuccess(false)

    const result = await updateLessonStatus(lesson.id, selected)

    if (result.error) {
      setError(result.error)
      setSelected(status)
    } else {
      setStatus(selected)
      setSuccess(true)
    }

    setLoading(false)
  }

  const isDirty = selected !== status

  return (
    <div>
      {/* Back + title */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/lessons"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Retour aux leçons
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-medium text-gray-900">
          {lesson.students.full_name} — {lesson.instructors.full_name}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: lesson info ─────────────────────────────── */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 px-6 py-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Détails de la leçon</h2>

          <InfoRow label="Élève" value={lesson.students.full_name} />
          <InfoRow label="Moniteur" value={lesson.instructors.full_name} />
          <InfoRow label="Début" value={formatDateTime(lesson.start_time)} />
          <InfoRow label="Fin" value={formatDateTime(lesson.end_time)} />
          <InfoRow
            label="Statut"
            value={<LessonStatusBadge status={status} />}
          />
          <InfoRow
            label="Notes"
            value={
              lesson.notes
                ? <span className="text-left">{lesson.notes}</span>
                : <span className="text-gray-300 font-normal">Aucune note</span>
            }
          />
        </div>

        {/* ── Right: status management ──────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Statut</h2>
          <p className="text-xs text-gray-400 mb-4">Statut actuel</p>

          <div className="mb-4">
            <LessonStatusBadge status={status} />
          </div>

          {canUpdate ? (
            <div className="space-y-3">
              <div>
                <label htmlFor="lesson_status" className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                  Changer le statut
                </label>
                <select
                  id="lesson_status"
                  value={selected}
                  onChange={(e) => setSelected(e.target.value as LessonStatus)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
                >
                  {LESSON_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleUpdate}
                disabled={!isDirty || loading}
                className="w-full rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Mise à jour...' : 'Mettre à jour'}
              </button>

              {success && (
                <p className="flex items-center gap-1.5 text-sm text-green-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Statut mis à jour avec succès.
                </p>
              )}

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-400 mt-2">
              Seuls les administrateurs peuvent modifier le statut.
            </p>
          )}
        </div>

      </div>
    </div>
  )
}
