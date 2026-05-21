import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/audit'
import type { Student, TrainingStatus, Appointment } from '@/types'

// ── Effective status badge ─────────────────────────────────────────────────────
function getEffectiveStatus(
  trainingStatus: TrainingStatus,
  hasMedicalDoc: boolean,
  appointment: Pick<Appointment, 'status'> | null
): { label: string; className: string } {
  if (trainingStatus === 'inactive')
    return { label: 'Inactif', className: 'bg-red-100 text-red-700' }
  if (trainingStatus === 'registered')
    return { label: 'Inscrit', className: 'bg-gray-100 text-gray-600' }
  if (trainingStatus === 'in_training')
    return { label: 'En formation', className: 'bg-indigo-100 text-indigo-700' }
  if (trainingStatus === 'completed')
    return { label: 'Formation terminée', className: 'bg-green-100 text-green-700' }

  // ready_for_exam — gate on additional conditions
  if (!hasMedicalDoc)
    return { label: 'Document médical requis', className: 'bg-orange-100 text-orange-700' }
  if (!appointment)
    return { label: 'Dossier en cours', className: 'bg-amber-100 text-amber-700' }
  if (appointment.status === 'pending')
    return { label: 'En attente de validation', className: 'bg-amber-100 text-amber-700' }
  if (appointment.status === 'confirmed')
    return { label: 'Rendez-vous confirmé', className: 'bg-green-100 text-green-700' }
  if (appointment.status === 'rejected')
    return { label: 'Demande rejetée', className: 'bg-red-100 text-red-700' }
  if (appointment.status === 'cancelled')
    return { label: 'Rendez-vous annulé', className: 'bg-gray-100 text-gray-500' }

  return { label: "Prêt pour l'examen", className: 'bg-amber-100 text-amber-700' }
}

// ── Prochaine étape ─────────────────────────────────────────────────────────────
interface NextStep {
  title: string
  description: string
  link?: { href: string; label: string }
  urgent?: boolean
}

function getNextStep(params: {
  hasMedicalDoc: boolean
  trainingStatus: TrainingStatus
  appointment: Pick<Appointment, 'status' | 'rejection_reason'> | null
  hasPassedMockExam: boolean
}): NextStep {
  const { hasMedicalDoc, trainingStatus, appointment, hasPassedMockExam } = params

  if (!hasMedicalDoc) {
    return {
      title: 'Document médical requis',
      description: "Votre document médical n'a pas encore été fourni. Contactez votre auto-école.",
      urgent: true,
    }
  }

  if (trainingStatus === 'registered' || trainingStatus === 'in_training') {
    return {
      title: 'Poursuivez votre formation',
      description: "Continuez vos cours de conduite. Votre auto-école soumettra votre dossier lorsque vous serez prêt.",
    }
  }

  if (!appointment) {
    return {
      title: "En attente de votre auto-école",
      description: "Votre formation est terminée. Votre auto-école va soumettre votre demande de rendez-vous d'examen.",
    }
  }

  if (appointment.status === 'pending') {
    return {
      title: "Demande en cours de traitement",
      description: "Votre demande de rendez-vous a été soumise. L'administration gouvernementale l'examine actuellement.",
    }
  }

  if (appointment.status === 'rejected') {
    return {
      title: "Demande rejetée — contactez votre auto-école",
      description: appointment.rejection_reason
        ? `Motif : ${appointment.rejection_reason}`
        : "Votre demande a été rejetée. Contactez votre auto-école pour plus d'informations.",
      urgent: true,
    }
  }

  if (appointment.status === 'cancelled') {
    return {
      title: "Rendez-vous annulé",
      description: "Votre rendez-vous a été annulé. Contactez votre auto-école pour soumettre une nouvelle demande.",
      urgent: true,
    }
  }

  if (appointment.status === 'confirmed') {
    if (!hasPassedMockExam) {
      return {
        title: "Préparez-vous avec un examen blanc",
        description: "Votre rendez-vous est confirmé. Passez un examen blanc pour vous entraîner avant le grand jour.",
        link: { href: '/student/exams', label: "Commencer l'examen blanc" },
      }
    }
    return {
      title: "Vous êtes prêt pour l'examen !",
      description: "Votre rendez-vous est confirmé et vous avez réussi un examen blanc. Bonne chance !",
    }
  }

  return {
    title: "Dossier en cours",
    description: "Votre dossier est en cours de traitement.",
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

// ── Appointment status badge ───────────────────────────────────────────────────
const APPT_STATUS: Record<string, { label: string; className: string }> = {
  pending:   { label: 'En attente de validation', className: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Rendez-vous validé',       className: 'bg-green-100 text-green-700' },
  rejected:  { label: 'Rejeté',                   className: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Annulé',                   className: 'bg-gray-100 text-gray-500' },
}

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

  const [{ data: pastExams }, { data: appointmentRaw }] = await Promise.all([
    supabase
      .from('mock_exams')
      .select('score, total_questions, passed, created_at')
      .eq('student_id', student.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('appointments')
      .select('id, status, rejection_reason, scheduled_at, requested_at, approved_at, rejected_at, created_at')
      .eq('student_id', student.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  type ApptSnap = Pick<Appointment, 'id' | 'status' | 'rejection_reason' | 'scheduled_at' | 'requested_at' | 'approved_at' | 'rejected_at' | 'created_at'>
  const appointment = appointmentRaw as ApptSnap | null

  const hasMedicalDoc     = !!student.medical_document_url
  const hasPassedMockExam = (pastExams ?? []).some((e) => e.passed)
  const bestScore = pastExams && pastExams.length > 0
    ? Math.max(...pastExams.map((e) => e.score))
    : null

  const effectiveBadge = getEffectiveStatus(student.training_status, hasMedicalDoc, appointment)
  const nextStep = getNextStep({
    hasMedicalDoc,
    trainingStatus: student.training_status,
    appointment,
    hasPassedMockExam,
  })

  const dateTimestamp = (iso: string | null | undefined) =>
    iso ? new Date(iso).toLocaleString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }) : null

  return (
    <div className="space-y-6">
      {/* Welcome card */}
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

      {/* Prochaine étape */}
      <div className={`rounded-xl border shadow-sm overflow-hidden ${
        nextStep.urgent
          ? 'bg-amber-50 border-amber-200'
          : 'bg-white border-gray-200'
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

      {/* Info cards */}
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

      {/* Progress checklist */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Progression du dossier</h2>
        </div>
        <div className="px-6 py-4 space-y-3">
          <ChecklistItem done={true}                                 label="Inscription élève créée" />
          <ChecklistItem done={hasMedicalDoc}                        label="Document médical fourni" />
          <ChecklistItem done={!!appointment}                        label="Demande de rendez-vous envoyée" />
          <ChecklistItem done={appointment?.status === 'confirmed'}  label="Rendez-vous validé par l'administration" />
          <ChecklistItem done={hasPassedMockExam}                    label="Examen blanc réussi" />
        </div>
      </div>

      {/* Appointment status */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Examen de conduite</h2>
        </div>

        {!appointment ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-gray-400">Aucun rendez-vous demandé.</p>
            <p className="text-xs text-gray-300 mt-1">
              Votre auto-école soumettra une demande lorsque votre formation sera terminée.
            </p>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-gray-600 shrink-0">Statut</p>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${APPT_STATUS[appointment.status]?.className ?? 'bg-gray-100 text-gray-600'}`}>
                {APPT_STATUS[appointment.status]?.label ?? appointment.status}
              </span>
            </div>

            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-gray-600 shrink-0">Demande soumise le</p>
              <p className="text-sm font-medium text-gray-900 text-right min-w-0">
                {new Date(appointment.requested_at ?? appointment.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </p>
            </div>

            {appointment.status === 'confirmed' && appointment.approved_at && (
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-gray-600 shrink-0">Validé le</p>
                <p className="text-sm font-medium text-green-700 text-right min-w-0">
                  {new Date(appointment.approved_at).toLocaleDateString('fr-FR', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              </div>
            )}

            {appointment.status === 'confirmed' && appointment.scheduled_at && (
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-gray-600 shrink-0">Date du rendez-vous</p>
                <p className="text-sm font-semibold text-green-700 text-right min-w-0">
                  {dateTimestamp(appointment.scheduled_at)}
                </p>
              </div>
            )}

            {appointment.status === 'rejected' && appointment.rejected_at && (
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-gray-600 shrink-0">Rejeté le</p>
                <p className="text-sm text-red-600 text-right min-w-0">
                  {new Date(appointment.rejected_at).toLocaleDateString('fr-FR', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              </div>
            )}

            {appointment.status === 'rejected' && appointment.rejection_reason && (
              <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 mt-2">
                <p className="text-xs font-medium text-red-700 mb-1">Motif du rejet</p>
                <p className="text-sm text-red-600">{appointment.rejection_reason}</p>
              </div>
            )}

            {appointment.status === 'pending' && (
              <p className="text-xs text-gray-400 italic">
                Votre demande est en cours d&apos;examen. Vous serez informé dès qu&apos;une décision est prise.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Mock exam results */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Examens blancs</h2>
          <Link href="/student/exams" className="text-sm font-medium text-navy hover:underline">
            Passer un examen →
          </Link>
        </div>
        {!pastExams || pastExams.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-gray-400">Aucun examen blanc passé.</p>
            <Link href="/student/exams"
                  className="mt-3 inline-block rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90 transition-colors">
              Commencer
            </Link>
          </div>
        ) : (
          <div className="px-6 py-4">
            <div className="flex gap-6 mb-4">
              <div>
                <p className="text-xs text-gray-500">Examens passés</p>
                <p className="text-2xl font-bold text-gray-900">{pastExams.length}</p>
              </div>
              {bestScore !== null && (
                <div>
                  <p className="text-xs text-gray-500">Meilleur score</p>
                  <p className="text-2xl font-bold text-gray-900">{bestScore}%</p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              {pastExams.slice(0, 3).map((e, i) => (
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
