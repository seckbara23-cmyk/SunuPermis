'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Student, TrainingStatus, UserRole } from '@/types'
import { updateTrainingStatus, updateStudentInfo } from '@/app/dashboard/students/actions'
import { TrainingStatusBadge, PaymentStatusBadge } from '@/components/ui/StatusBadge'
import { TRAINING_STATUS_OPTIONS } from '@/lib/formatters'

const BLOOD_TYPES = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−']

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
  student: Student
  canUpdate: boolean
  role: UserRole
}

export default function StudentDetail({ student, canUpdate }: Props) {
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus>(student.training_status)
  const [selected, setSelected] = useState<TrainingStatus>(student.training_status)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Info edit state
  const [bloodType, setBloodType] = useState(student.blood_type ?? '')
  const [medicalUrl, setMedicalUrl] = useState(student.medical_document_url ?? '')
  const [infoLoading, setInfoLoading] = useState(false)
  const [infoError, setInfoError] = useState<string | null>(null)
  const [infoSuccess, setInfoSuccess] = useState(false)

  const isInfoDirty =
    bloodType !== (student.blood_type ?? '') ||
    medicalUrl !== (student.medical_document_url ?? '')

  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => setSuccess(false), 3000)
    return () => clearTimeout(t)
  }, [success])

  useEffect(() => {
    if (!infoSuccess) return
    const t = setTimeout(() => setInfoSuccess(false), 3000)
    return () => clearTimeout(t)
  }, [infoSuccess])

  async function handleUpdate() {
    if (selected === trainingStatus) return
    setLoading(true)
    setError(null)
    setSuccess(false)

    const result = await updateTrainingStatus(student.id, selected)

    if (result.error) {
      setError(result.error)
      setSelected(trainingStatus)
    } else {
      setTrainingStatus(selected)
      setSuccess(true)
    }

    setLoading(false)
  }

  async function handleInfoUpdate() {
    if (!isInfoDirty) return
    setInfoLoading(true)
    setInfoError(null)
    setInfoSuccess(false)

    const result = await updateStudentInfo(student.id, {
      blood_type: bloodType || undefined,
      medical_document_url: medicalUrl || undefined,
    })

    if (result.error) {
      setInfoError(result.error)
    } else {
      setInfoSuccess(true)
    }

    setInfoLoading(false)
  }

  const enrollmentDate = student.enrollment_date
    ? new Date(student.enrollment_date).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '—'

  const isDirty = selected !== trainingStatus

  return (
    <div>
      {/* Back + title */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/students"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Retour aux élèves
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-medium text-gray-900">{student.full_name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: personal info ───────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Informations personnelles</h2>

            <InfoRow label="Nom complet" value={student.full_name} />
            <InfoRow
              label="Téléphone"
              value={student.phone || <span className="text-gray-300 font-normal">Non renseigné</span>}
            />
            <InfoRow
              label="Email"
              value={student.email || <span className="text-gray-300 font-normal">Non renseigné</span>}
            />
            <InfoRow label="Catégorie de permis" value={`Catégorie ${student.license_category}`} />
            <InfoRow label="Date d&apos;inscription" value={enrollmentDate} />
            <InfoRow
              label="Statut de paiement"
              value={<PaymentStatusBadge status={student.payment_status} />}
            />
            <InfoRow
              label="Groupe sanguin"
              value={student.blood_type ?? <span className="text-gray-300 font-normal">Non renseigné</span>}
            />
            <InfoRow
              label="Document médical"
              value={
                student.medical_document_url ? (
                  <a
                    href={student.medical_document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-navy hover:underline"
                  >
                    Voir le document
                  </a>
                ) : (
                  <span className="text-gray-300 font-normal">Non uploadé</span>
                )
              }
            />
          </div>

          {/* Medical info edit card */}
          {canUpdate && (
            <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Informations médicales</h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="blood_type" className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                    Groupe sanguin
                  </label>
                  <select
                    id="blood_type"
                    value={bloodType}
                    onChange={(e) => setBloodType(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
                  >
                    <option value="">Non renseigné</option>
                    {BLOOD_TYPES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="medical_url" className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                    URL du document médical
                  </label>
                  <input
                    id="medical_url"
                    type="url"
                    value={medicalUrl}
                    onChange={(e) => setMedicalUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
                  />
                </div>

                <button
                  onClick={handleInfoUpdate}
                  disabled={!isInfoDirty || infoLoading}
                  className="w-full rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {infoLoading ? 'Mise à jour...' : 'Enregistrer'}
                </button>

                {infoSuccess && (
                  <p className="flex items-center gap-1.5 text-sm text-green-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Informations mises à jour.
                  </p>
                )}

                {infoError && (
                  <p className="text-sm text-red-600">{infoError}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: status management ──────────────────────── */}
        <div className="flex flex-col gap-4">

          {/* Training status card */}
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Statut de formation</h2>
            <p className="text-xs text-gray-400 mb-4">Statut actuel</p>

            <div className="mb-4">
              <TrainingStatusBadge status={trainingStatus} />
            </div>

            {canUpdate ? (
              <div className="space-y-3">
                <div>
                  <label htmlFor="training_status" className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                    Changer le statut
                  </label>
                  <select
                    id="training_status"
                    value={selected}
                    onChange={(e) => setSelected(e.target.value as TrainingStatus)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent"
                  >
                    {TRAINING_STATUS_OPTIONS.map((opt) => (
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
    </div>
  )
}
