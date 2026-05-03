'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Instructor, InstructorStatus } from '@/types'
import { updateInstructorStatus } from '@/app/dashboard/instructors/actions'
import { InstructorStatusBadge } from '@/components/ui/StatusBadge'
import { INSTRUCTOR_STATUS_OPTIONS } from '@/lib/formatters'

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

interface Props {
  instructor: Instructor
  canUpdate: boolean
}

export default function InstructorDetail({ instructor, canUpdate }: Props) {
  const [status, setStatus] = useState<InstructorStatus>(instructor.status)
  const [selected, setSelected] = useState<InstructorStatus>(instructor.status)
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

    const result = await updateInstructorStatus(instructor.id, selected)

    if (result.error) {
      setError(result.error)
      setSelected(status)
    } else {
      setStatus(selected)
      setSuccess(true)
    }

    setLoading(false)
  }

  const createdAt = new Date(instructor.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const isDirty = selected !== status

  return (
    <div>
      {/* Back + title */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/instructors"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Retour aux moniteurs
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-medium text-gray-900">{instructor.full_name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: personal info ───────────────────────────── */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 px-6 py-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Informations personnelles</h2>

          <InfoRow label="Nom complet" value={instructor.full_name} />
          <InfoRow
            label="Téléphone"
            value={instructor.phone || <span className="text-gray-300 font-normal">Non renseigné</span>}
          />
          <InfoRow
            label="Email"
            value={instructor.email || <span className="text-gray-300 font-normal">Non renseigné</span>}
          />
          <InfoRow label="Date d'inscription" value={createdAt} />
        </div>

        {/* ── Right: status management ──────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Statut</h2>
          <p className="text-xs text-gray-400 mb-4">Statut actuel</p>

          <div className="mb-4">
            <InstructorStatusBadge status={status} />
          </div>

          {canUpdate ? (
            <div className="space-y-3">
              <div>
                <label htmlFor="status" className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                  Changer le statut
                </label>
                <select
                  id="status"
                  value={selected}
                  onChange={(e) => setSelected(e.target.value as InstructorStatus)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {INSTRUCTOR_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleUpdate}
                disabled={!isDirty || loading}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
