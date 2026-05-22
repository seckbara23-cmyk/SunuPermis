import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/audit'
import { getStudentProgress } from '@/services/student-progress'
import { PASS_THRESHOLD } from '@/lib/exam/categories'
import type { Student, TrainingStatus } from '@/types'
import type { StudentProgressAppointment, StudentProgressBooking } from '@/services/student-progress'

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return null
  return new Date(iso).toLocaleString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// "castor, dakar" → "Centre d'examen Castor — Dakar"
// Leaves formal addresses (starting with a number or known keyword) as-is.
function formatExamLocation(raw: string | null | undefined): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (/^(centre d[''']|center |route |avenue |boulevard |rue |\d)/i.test(trimmed)) {
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
  }
  const parts = trimmed.split(',').map((s) => s.trim()).filter(Boolean)
  if (parts.length >= 2) {
    const place = parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
    const city  = parts.slice(1).join(', ')
    return `Centre d'examen ${place} — ${city}`
  }
  return `Centre d'examen ${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`
}

// Countdown chip — computed server-side on each dynamic render.
function getExamCountdown(
  iso: string | null | undefined
): { label: string; className: string } | null {
  if (!iso) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const exam  = new Date(iso); exam.setHours(0, 0, 0, 0)
  const diff  = Math.round((exam.getTime() - today.getTime()) / 86_400_000)

  if (diff < 0)   return { label: 'Examen passé',             className: 'bg-gray-100 text-gray-500' }
  if (diff === 0) return { label: "Examen aujourd'hui !",     className: 'bg-green-100 text-green-700' }
  if (diff === 1) return { label: 'Examen demain',            className: 'bg-amber-100 text-amber-700' }
  if (diff <= 7)  return { label: `Examen dans ${diff} jours`, className: 'bg-amber-100 text-amber-700' }
  return           { label: `Examen dans ${diff} jours`,       className: 'bg-blue-50 text-blue-700' }
}

// ── Dynamic status badge ───────────────────────────────────────────────────────
function getEffectiveStatus(
  trainingStatus: TrainingStatus,
  hasMedicalDoc: boolean,
  appointment: Pick<StudentProgressAppointment, 'status'> | null,
  booking: Pick<StudentProgressBooking, 'status'> | null,
  hasPassedMockExam: boolean,
): { label: string; className: string } {
  if (trainingStatus === 'inactive')
    return { label: 'Inactif', className: 'bg-red-100 text-red-700' }

  const isApproved  = appointment?.status === 'confirmed' || booking?.status === 'approved'
  const isPending   = appointment?.status === 'pending'   || booking?.status === 'pending'
  const isRejected  = appointment?.status === 'rejected'  || booking?.status === 'rejected'
  const isCancelled = appointment?.status === 'cancelled'

  if (isApproved && hasPassedMockExam)
    return { label: "Prêt pour l'examen",    className: 'bg-green-100 text-green-700' }
  if (isApproved)
    return { label: 'Convocation confirmée', className: 'bg-green-100 text-green-700' }
  if (isPending)
    return { label: 'Demande envoyée',       className: 'bg-amber-100 text-amber-700' }
  if (isRejected)
    return { label: 'Demande rejetée',       className: 'bg-red-100 text-red-700' }
  if (isCancelled)
    return { label: 'Annulé',               className: 'bg-gray-100 text-gray-500' }

  if (trainingStatus === 'registered')
    return { label: 'Inscrit',              className: 'bg-gray-100 text-gray-600' }
  if (trainingStatus === 'in_training')
    return { label: 'En formation',         className: 'bg-indigo-100 text-indigo-700' }
  if (trainingStatus === 'completed' || trainingStatus === 'ready_for_exam') {
    if (!hasMedicalDoc)
      return { label: 'Document médical requis', className: 'bg-orange-100 text-orange-700' }
    return { label: 'Formation terminée', className: 'bg-blue-100 text-blue-700' }
  }

  return { label: 'En formation', className: 'bg-indigo-100 text-indigo-700' }
}

// ── Next step card ─────────────────────────────────────────────────────────────
interface NextStep {
  title: string
  description: string
  link?: { href: string; label: string }
  urgent?: boolean
}

function getNextStep(params: {
  hasMedicalDoc: boolean
  trainingStatus: TrainingStatus
  appointment: Pick<StudentProgressAppointment, 'status' | 'rejectionReason'> | null
  booking: Pick<StudentProgressBooking, 'status'> | null
  hasPassedMockExam: boolean
}): NextStep {
  const { hasMedicalDoc, trainingStatus, appointment, booking, hasPassedMockExam } = params

  const isApproved  = appointment?.status === 'confirmed' || booking?.status === 'approved'
  const isPending   = appointment?.status === 'pending'   || booking?.status === 'pending'
  const isRejected  = appointment?.status === 'rejected'  || booking?.status === 'rejected'
  const isCancelled = appointment?.status === 'cancelled'

  if (isApproved && !hasPassedMockExam) return {
    title: "Préparez-vous avec un examen blanc",
    description: `Votre rendez-vous est confirmé. Passez un examen blanc (score requis : ${PASS_THRESHOLD}%) pour vous entraîner avant le grand jour.`,
    link: { href: '/student/exams', label: "Commencer l'examen blanc" },
  }
  if (isApproved) return {
    title: "Vous êtes prêt pour l'examen !",
    description: "Votre rendez-vous est confirmé et vous avez réussi un examen blanc. Bonne chance !",
  }
  if (isRejected) return {
    title: "Demande rejetée — contactez votre auto-école",
    description: appointment?.rejectionReason
      ? `Motif : ${appointment.rejectionReason}`
      : "Votre demande a été rejetée. Contactez votre auto-école pour plus d'informations.",
    urgent: true,
  }
  if (isCancelled) return {
    title: "Rendez-vous annulé",
    description: "Votre rendez-vous a été annulé. Contactez votre auto-école pour soumettre une nouvelle demande.",
    urgent: true,
  }
  if (isPending) return {
    title: "Demande en cours de traitement",
    description: "Votre demande a été soumise. L'administration gouvernementale l'examine actuellement.",
  }
  if (!hasMedicalDoc) return {
    title: 'Document médical requis',
    description: "Votre document médical n'a pas encore été fourni. Contactez votre auto-école.",
    urgent: true,
  }
  if (trainingStatus === 'registered' || trainingStatus === 'in_training') return {
    title: 'Poursuivez votre formation',
    description: "Continuez vos cours de conduite. Votre auto-école soumettra votre dossier lorsque vous serez prêt.",
  }
  return {
    title: "En attente de votre auto-école",
    description: "Votre formation est terminée. Votre auto-école va soumettre votre demande de rendez-vous d'examen.",
  }
}

// ── Checklist item ─────────────────────────────────────────────────────────────
function ChecklistItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${done ? 'bg-green-100' : 'bg-gray-100'}`}>
        {done ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
        )}
      </span>
      <span className={`text-sm ${done ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
    </div>
  )
}

// ── Status badge maps ──────────────────────────────────────────────────────────
const APPT_STATUS: Record<string, { label: string; className: string }> = {
  pending:   { label: 'En attente de validation', className: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Rendez-vous validé',       className: 'bg-green-100 text-green-700' },
  rejected:  { label: 'Rejeté',                   className: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Annulé',                   className: 'bg-gray-100 text-gray-500' },
}
const BOOKING_STATUS: Record<string, { label: string; className: string }> = {
  pending:  { label: 'Réservation en attente', className: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Session confirmée',       className: 'bg-green-100 text-green-700' },
  rejected: { label: 'Réservation rejetée',     className: 'bg-red-100 text-red-700' },
}

// ── Shared sub-components ──────────────────────────────────────────────────────
function DetailRow({
  label, value, highlight, mono,
}: {
  label: string; value: string | null | undefined
  highlight?: boolean; mono?: boolean
}) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between gap-4">
      <p className="text-sm text-gray-600 shrink-0">{label}</p>
      <p className={`text-sm text-right min-w-0 break-words ${
        highlight ? 'font-semibold text-green-700'
        : mono    ? 'font-mono font-bold text-navy break-all'
        : 'font-medium text-gray-900'
      }`}>{value}</p>
    </div>
  )
}

function CountdownChip({ iso }: { iso: string | null | undefined }) {
  const cd = getExamCountdown(iso)
  if (!cd) return null
  return (
    <div className="flex justify-end">
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cd.className}`}>
        {cd.label}
      </span>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default async function StudentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, driving_school_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/login')

  const [{ data: studentRaw }, { data: schoolRaw }] = await Promise.all([
    supabase.from('students').select('*').eq('profile_id', profile.id).single(),
    supabase.from('driving_schools').select('name').eq('id', profile.driving_school_id!).single(),
  ])

  const student = studentRaw as Student | null

  if (!student) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[#00853F] via-[#FDEF42] to-[#E31B23]" />
          <div className="px-6 py-8 text-center">
            <p className="text-gray-500 text-sm">Votre dossier élève n&apos;a pas encore été créé. Contactez votre auto-école.</p>
          </div>
        </div>
      </div>
    )
  }

  let medicalDocSignedUrl: string | null = null
  if (student.medical_document_url) {
    const { data: signedData } = await supabase.storage
      .from('medical-documents')
      .createSignedUrl(student.medical_document_url, 600)
    medicalDocSignedUrl = signedData?.signedUrl ?? null
    if (medicalDocSignedUrl) {
      await logAuditEvent({
        actorProfileId: profile.id,
        actorUserId:    user.id,
        actorRole:      'student',
        action:         'document.accessed',
        entityType:     'student',
        entityId:       student.id,
        metadata:       { document_path: student.medical_document_url },
      })
    }
  }

  const progress = await getStudentProgress(student.id)
  const { appointment, booking, mockExams } = progress
  const hasMedicalDoc = !!student.medical_document_url

  const effectiveBadge = getEffectiveStatus(
    student.training_status, hasMedicalDoc, appointment, booking, progress.mockExamPassed
  )
  const nextStep = getNextStep({
    hasMedicalDoc,
    trainingStatus: student.training_status,
    appointment, booking,
    hasPassedMockExam: progress.mockExamPassed,
  })

  // Pre-compute convocation props to avoid repeated ternaries in JSX
  const hasConvocation = appointment?.status === 'confirmed' || booking?.status === 'approved'
  const convocationRef  = appointment?.status === 'confirmed'
    ? appointment.confirmationReference
    : booking?.confirmationReference ?? null
  const convocationHref = appointment?.status === 'confirmed'
    ? `/student/appointments/${appointment.id}/confirmation`
    : booking
      ? `/student/bookings/${booking.id}/confirmation`
      : null

  return (
    <div className="space-y-6">

      {/* ── Welcome card ────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[#00853F] via-[#FDEF42] to-[#E31B23]" />
        <div className="px-6 py-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{student.full_name}</h1>
            <p className="mt-0.5 text-sm text-gray-500">{schoolRaw?.name ?? 'Auto-école'}</p>
          </div>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${effectiveBadge.className}`}>
            {effectiveBadge.label}
          </span>
        </div>
      </div>

      {/* ── Prochaine étape ──────────────────────────────────────── */}
      <div className={`rounded-xl border shadow-sm overflow-hidden ${
        nextStep.urgent ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'
      }`}>
        <div className="px-6 py-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Prochaine étape</p>
          <p className={`text-base font-semibold ${nextStep.urgent ? 'text-amber-800' : 'text-gray-900'}`}>
            {nextStep.title}
          </p>
          <p className={`text-sm mt-1 ${nextStep.urgent ? 'text-amber-700' : 'text-gray-500'}`}>
            {nextStep.description}
          </p>
          {nextStep.link && (
            <Link
              href={nextStep.link.href}
              className="mt-3 inline-flex items-center rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90 transition-colors"
            >
              {nextStep.link.label}
            </Link>
          )}
        </div>
      </div>

      {/* ── Info cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Groupe sanguin</p>
          <p className="mt-2 text-xl font-bold text-gray-900">{student.blood_type ?? '—'}</p>
          {!student.blood_type && <p className="text-xs text-gray-400 mt-1">Non renseigné</p>}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Document médical</p>
          <div className="mt-2">
            {medicalDocSignedUrl ? (
              <a href={medicalDocSignedUrl} target="_blank" rel="noopener noreferrer"
                 className="text-sm font-semibold text-navy hover:underline">
                Voir le document
              </a>
            ) : (
              <p className="text-xl font-bold text-gray-400">—</p>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {student.medical_document_url ? 'Uploadé' : 'Non uploadé'}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Catégorie permis</p>
          <p className="mt-2 text-xl font-bold text-gray-900">{student.license_category}</p>
          <p className="text-xs text-gray-400 mt-1">
            Inscrit le {new Date(student.created_at).toLocaleDateString('fr-FR')}
          </p>
        </div>
      </div>

      {/* ── Progression du dossier ───────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Progression du dossier</h2>
        </div>
        <div className="px-6 py-4 space-y-3">
          <ChecklistItem done={true}                          label="Inscription élève créée" />
          <ChecklistItem done={hasMedicalDoc}                 label="Document médical fourni" />
          <ChecklistItem done={progress.appointmentRequested} label="Demande de rendez-vous envoyée" />
          <ChecklistItem done={progress.appointmentApproved}  label="Rendez-vous validé par l'administration" />
          <ChecklistItem done={progress.mockExamPassed}       label={`Examen blanc réussi (≥ ${PASS_THRESHOLD}%)`} />
        </div>
      </div>

      {/* ── Examen de conduite ───────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Examen de conduite</h2>
        </div>

        {!appointment && !booking ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-gray-400">Aucun rendez-vous n&apos;a encore été demandé.</p>
            <p className="text-xs text-gray-300 mt-2 max-w-sm mx-auto">
              Votre auto-école soumettra une demande lorsque votre dossier sera prêt.
            </p>
          </div>

        ) : appointment ? (
          /* Appointment-based (government request workflow) */
          <div className="px-6 py-5 space-y-3">
            <DetailRow
              label="Statut"
              value={APPT_STATUS[appointment.status]?.label ?? appointment.status}
            />
            <DetailRow
              label="Demande soumise le"
              value={formatDate(appointment.requestedAt ?? appointment.createdAt)}
            />
            {appointment.status === 'confirmed' && (
              <>
                <DetailRow label="Validé le"          value={formatDate(appointment.approvedAt)} />
                <DetailRow label="Date du rendez-vous" value={formatDateTime(appointment.examDate)} highlight />
                <CountdownChip iso={appointment.examDate} />
                <DetailRow label="Centre d'examen"    value={formatExamLocation(appointment.examLocation)} />
                <DetailRow label="Référence"          value={appointment.confirmationReference} mono />
              </>
            )}
            {appointment.status === 'rejected' && (
              <>
                <DetailRow label="Rejeté le" value={formatDate(appointment.rejectedAt)} />
                {appointment.rejectionReason && (
                  <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3">
                    <p className="text-xs font-medium text-red-700 mb-1">Motif du rejet</p>
                    <p className="text-sm text-red-600">{appointment.rejectionReason}</p>
                  </div>
                )}
              </>
            )}
            {appointment.status === 'pending' && (
              <p className="text-xs text-gray-400 italic">
                Votre demande est en cours d&apos;examen. Vous serez informé dès qu&apos;une décision est prise.
              </p>
            )}
          </div>

        ) : booking ? (
          /* Booking-based (session reservation workflow) */
          <div className="px-6 py-5 space-y-3">
            <DetailRow
              label="Statut"
              value={BOOKING_STATUS[booking.status]?.label ?? booking.status}
            />
            <DetailRow label="Réservation soumise le" value={formatDate(booking.createdAt)} />
            {booking.status === 'approved' && (
              <>
                <DetailRow label="Approuvé le"        value={formatDate(booking.approvedAt)} />
                <DetailRow label="Date de la session" value={formatDateTime(booking.examDate)} highlight />
                <CountdownChip iso={booking.examDate} />
                <DetailRow label="Centre d'examen"    value={formatExamLocation(booking.examLocation)} />
                <DetailRow label="Référence"          value={booking.confirmationReference} mono />
              </>
            )}
            {booking.status === 'pending' && (
              <p className="text-xs text-gray-400 italic">
                Votre réservation est en cours d&apos;examen. Vous serez informé dès qu&apos;une décision est prise.
              </p>
            )}
            {booking.status === 'rejected' && (
              <p className="text-sm text-red-600">
                Votre réservation a été rejetée. Contactez votre auto-école pour soumettre une nouvelle demande.
              </p>
            )}
          </div>
        ) : null}
      </div>

      {/* ── Documents officiels (only when convocation exists) ───── */}
      {hasConvocation && convocationHref && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Documents officiels</h2>
          </div>
          <div className="px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">Convocation à l&apos;examen</p>
                {convocationRef && (
                  <p className="text-xs font-mono font-bold text-navy mt-0.5 break-all">
                    {convocationRef}
                  </p>
                )}
              </div>
              <Link
                href={convocationHref}
                className="inline-flex items-center gap-1.5 rounded-lg border border-navy px-4 py-2 text-sm font-semibold text-navy hover:bg-navy hover:text-white transition-colors w-full sm:w-auto justify-center shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Voir / Imprimer
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Examens blancs ───────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Examens blancs</h2>
          <Link href="/student/exams" className="text-sm font-medium text-navy hover:underline">
            Passer un examen →
          </Link>
        </div>
        {mockExams.count === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-gray-500">Commencez un examen blanc pour vous entraîner avant le jour J.</p>
            <Link
              href="/student/exams"
              className="mt-4 inline-flex items-center rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90 transition-colors"
            >
              Commencer
            </Link>
          </div>
        ) : (
          <div className="px-6 py-4">
            <div className="flex gap-6 mb-4">
              <div>
                <p className="text-xs text-gray-500">Examens passés</p>
                <p className="text-2xl font-bold text-gray-900">{mockExams.count}</p>
              </div>
              {mockExams.bestScore !== null && (
                <div>
                  <p className="text-xs text-gray-500">Meilleur score</p>
                  <p className="text-2xl font-bold text-gray-900">{mockExams.bestScore}%</p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              {mockExams.recent.slice(0, 3).map((e, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    {new Date(e.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{e.score}%</span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      e.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {e.passed ? 'Réussi' : 'Échoué'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
