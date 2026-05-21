'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import type { Student, TrainingStatus, UserRole } from '@/types'
import {
  updateTrainingStatus,
  updateStudentInfo,
  uploadMedicalDocument,
  getSignedDocumentUrl,
  suspendStudent,
  archiveStudent,
  reactivateStudent,
} from '@/app/dashboard/students/actions'
import { TrainingStatusBadge, PaymentStatusBadge, AccountStatusBadge } from '@/components/ui/StatusBadge'
import { TRAINING_STATUS_OPTIONS } from '@/lib/formatters'
import LifecycleModal from './LifecycleModal'

const BLOOD_TYPES = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−']
const ACCEPTED_MIME = 'application/pdf,image/jpeg,image/png,image/webp'

interface InfoRowProps {
  label: string
  value: React.ReactNode
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 shrink-0 w-36">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right min-w-0 break-words">{value}</span>
    </div>
  )
}

interface Props {
  student: Student
  canUpdate: boolean
  role: UserRole
}

export default function StudentDetail({ student, canUpdate }: Props) {
  // ── Account lifecycle ─────────────────────────────────────
  const [accountStatus, setAccountStatus]   = useState(student.account_status)
  const [lifecycleModal, setLifecycleModal] = useState<'suspend' | 'archive' | 'reactivate' | null>(null)
  const [lifecycleError, setLifecycleError] = useState<string | null>(null)

  // ── Training status ───────────────────────────────────────
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus>(student.training_status)
  const [selected, setSelected]             = useState<TrainingStatus>(student.training_status)
  const [statusLoading, setStatusLoading]   = useState(false)
  const [statusError, setStatusError]       = useState<string | null>(null)
  const [statusSuccess, setStatusSuccess]   = useState(false)

  // ── Blood type ────────────────────────────────────────────
  const [bloodType, setBloodType]     = useState(student.blood_type ?? '')
  const [btLoading, setBtLoading]     = useState(false)
  const [btError, setBtError]         = useState<string | null>(null)
  const [btSuccess, setBtSuccess]     = useState(false)
  const isBloodTypeDirty = bloodType !== (student.blood_type ?? '')

  // ── Medical document upload ───────────────────────────────
  const [hasDocument, setHasDocument]     = useState(!!student.medical_document_url)
  const [selectedFile, setSelectedFile]   = useState<File | null>(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadError, setUploadError]     = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [viewLoading, setViewLoading]     = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!statusSuccess) return
    const t = setTimeout(() => setStatusSuccess(false), 3000)
    return () => clearTimeout(t)
  }, [statusSuccess])

  useEffect(() => {
    if (!btSuccess) return
    const t = setTimeout(() => setBtSuccess(false), 3000)
    return () => clearTimeout(t)
  }, [btSuccess])

  useEffect(() => {
    if (!uploadSuccess) return
    const t = setTimeout(() => setUploadSuccess(false), 3000)
    return () => clearTimeout(t)
  }, [uploadSuccess])

  async function handleLifecycleConfirm(reason: string) {
    setLifecycleError(null)
    let result: { error?: string }

    if (lifecycleModal === 'suspend') {
      result = await suspendStudent(student.id, reason)
    } else if (lifecycleModal === 'archive') {
      result = await archiveStudent(student.id, reason)
    } else {
      result = await reactivateStudent(student.id)
    }

    if (result.error) {
      setLifecycleError(result.error)
      throw new Error(result.error)
    }

    if (lifecycleModal === 'suspend')    setAccountStatus('suspended')
    if (lifecycleModal === 'archive')    setAccountStatus('archived')
    if (lifecycleModal === 'reactivate') setAccountStatus('active')
    setLifecycleModal(null)
  }

  async function handleStatusUpdate() {
    if (selected === trainingStatus) return
    setStatusLoading(true)
    setStatusError(null)

    const result = await updateTrainingStatus(student.id, selected)
    if (result.error) {
      setStatusError(result.error)
      setSelected(trainingStatus)
    } else {
      setTrainingStatus(selected)
      setStatusSuccess(true)
    }
    setStatusLoading(false)
  }

  async function handleBloodTypeUpdate() {
    if (!isBloodTypeDirty) return
    setBtLoading(true)
    setBtError(null)

    const result = await updateStudentInfo(student.id, { blood_type: bloodType || undefined })
    if (result.error) setBtError(result.error)
    else setBtSuccess(true)

    setBtLoading(false)
  }

  async function handleUpload() {
    if (!selectedFile) return
    setUploadLoading(true)
    setUploadError(null)

    const formData = new FormData()
    formData.append('student_id', student.id)
    formData.append('file', selectedFile)

    const result = await uploadMedicalDocument(formData)
    if (result.error) {
      setUploadError(result.error)
    } else {
      setHasDocument(true)
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setUploadSuccess(true)
    }
    setUploadLoading(false)
  }

  async function handleViewDocument() {
    setViewLoading(true)
    const result = await getSignedDocumentUrl(student.id)
    if (result.url) {
      window.open(result.url, '_blank', 'noopener,noreferrer')
    } else if (result.error) {
      setUploadError(result.error)
    }
    setViewLoading(false)
  }

  const enrollmentDate = student.enrollment_date
    ? new Date(student.enrollment_date).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '—'

  const isDirty = selected !== trainingStatus

  return (
    <>
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

        {/* ── Left column ───────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Personal info */}
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
                hasDocument ? (
                  <button
                    onClick={handleViewDocument}
                    disabled={viewLoading}
                    className="text-sm font-medium text-navy hover:underline disabled:opacity-50 transition-colors"
                  >
                    {viewLoading ? 'Chargement…' : 'Voir le document'}
                  </button>
                ) : (
                  <span className="text-gray-300 font-normal">Non uploadé</span>
                )
              }
            />
          </div>

          {/* Medical info edit (school_admin / super_admin only) */}
          {canUpdate && (
            <div className="bg-white rounded-xl border border-gray-200 px-6 py-5 space-y-6">
              <h2 className="text-base font-semibold text-gray-900">Informations médicales</h2>

              {/* Blood type */}
              <div className="space-y-3">
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
                <button
                  onClick={handleBloodTypeUpdate}
                  disabled={!isBloodTypeDirty || btLoading}
                  className="w-full rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {btLoading ? 'Enregistrement…' : 'Enregistrer le groupe sanguin'}
                </button>
                {btSuccess && (
                  <p className="flex items-center gap-1.5 text-sm text-green-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Groupe sanguin mis à jour.
                  </p>
                )}
                {btError && <p className="text-sm text-red-600">{btError}</p>}
              </div>

              <div className="border-t border-gray-100" />

              {/* Medical document upload */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                    Document médical
                  </p>
                  <p className="text-xs text-gray-400 mb-3">
                    PDF, JPEG, PNG ou WebP — 10 Mo maximum.{' '}
                    {hasDocument && 'Un nouveau fichier remplacera le document existant.'}
                  </p>

                  {/* Current status badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                      hasDocument ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {hasDocument ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Document uploadé
                        </>
                      ) : 'Aucun document'}
                    </span>
                    {hasDocument && (
                      <button
                        onClick={handleViewDocument}
                        disabled={viewLoading}
                        className="text-xs font-medium text-navy hover:underline disabled:opacity-50"
                      >
                        {viewLoading ? 'Chargement…' : 'Voir'}
                      </button>
                    )}
                  </div>

                  {/* File picker */}
                  <label
                    htmlFor="medical_file"
                    className="flex items-center justify-center gap-2 w-full rounded-lg border-2 border-dashed border-gray-200 px-4 py-6 cursor-pointer hover:border-navy/40 hover:bg-gray-50 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m0 0l-3 3m3-3l3 3M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                    </svg>
                    <span className="text-sm text-gray-500">
                      {selectedFile ? selectedFile.name : 'Choisir un fichier…'}
                    </span>
                    <input
                      ref={fileInputRef}
                      id="medical_file"
                      type="file"
                      accept={ACCEPTED_MIME}
                      className="sr-only"
                      onChange={(e) => {
                        setSelectedFile(e.target.files?.[0] ?? null)
                        setUploadError(null)
                      }}
                    />
                  </label>
                </div>

                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploadLoading}
                  className="w-full rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {uploadLoading ? 'Upload en cours…' : 'Uploader le document'}
                </button>

                {uploadSuccess && (
                  <p className="flex items-center gap-1.5 text-sm text-green-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Document uploadé avec succès.
                  </p>
                )}
                {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: training status + lifecycle ───────────────── */}
        <div className="flex flex-col gap-4">

          {/* Account lifecycle panel */}
          {canUpdate && (
            <div className="bg-white rounded-xl border border-gray-200 px-6 py-5">
              <h2 className="text-base font-semibold text-gray-900 mb-1">Gestion du compte</h2>
              <p className="text-xs text-gray-400 mb-4">Statut actuel</p>

              <div className="mb-4">
                <AccountStatusBadge status={accountStatus} />
              </div>

              {lifecycleError && (
                <p className="mb-3 text-xs text-red-600">{lifecycleError}</p>
              )}

              <div className="flex flex-col gap-2">
                {accountStatus === 'active' && (
                  <>
                    <button
                      onClick={() => { setLifecycleError(null); setLifecycleModal('suspend') }}
                      className="w-full rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100 transition-colors"
                    >
                      Suspendre
                    </button>
                    <button
                      onClick={() => { setLifecycleError(null); setLifecycleModal('archive') }}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      Archiver
                    </button>
                  </>
                )}

                {accountStatus === 'suspended' && (
                  <>
                    <button
                      onClick={() => { setLifecycleError(null); setLifecycleModal('reactivate') }}
                      className="w-full rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
                    >
                      Réactiver
                    </button>
                    <button
                      onClick={() => { setLifecycleError(null); setLifecycleModal('archive') }}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      Archiver
                    </button>
                  </>
                )}

                {accountStatus === 'archived' && (
                  <button
                    onClick={() => { setLifecycleError(null); setLifecycleModal('reactivate') }}
                    className="w-full rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
                  >
                    Réactiver
                  </button>
                )}
              </div>
            </div>
          )}

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
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleStatusUpdate}
                  disabled={!isDirty || statusLoading}
                  className="w-full rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {statusLoading ? 'Mise à jour…' : 'Mettre à jour'}
                </button>

                {statusSuccess && (
                  <p className="flex items-center gap-1.5 text-sm text-green-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Statut mis à jour avec succès.
                  </p>
                )}
                {statusError && <p className="text-sm text-red-600">{statusError}</p>}
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

      {lifecycleModal && (
        <LifecycleModal
          action={lifecycleModal}
          studentName={student.full_name}
          onConfirm={handleLifecycleConfirm}
          onClose={() => { setLifecycleModal(null); setLifecycleError(null) }}
        />
      )}
    </>
  )
}
