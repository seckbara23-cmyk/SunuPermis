import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Student, TrainingStatus, ExamBookingWithDetails } from '@/types'

const TRAINING_BADGE: Record<TrainingStatus, { label: string; className: string }> = {
  registered:     { label: 'Inscrit',             className: 'bg-gray-100 text-gray-600' },
  in_training:    { label: 'En formation',        className: 'bg-indigo-100 text-indigo-700' },
  ready_for_exam: { label: "Prêt pour l'examen",  className: 'bg-amber-100 text-amber-700' },
  completed:      { label: 'Formation terminée',  className: 'bg-green-100 text-green-700' },
  inactive:       { label: 'Inactif',             className: 'bg-red-100 text-red-700' },
}

const BOOKING_BADGE: Record<string, string> = {
  pending:  'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}
const BOOKING_LABEL: Record<string, string> = {
  pending: 'En attente', approved: 'Approuvée', rejected: 'Rejetée',
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

  const [
    { data: studentRaw },
    { data: schoolRaw },
  ] = await Promise.all([
    supabase
      .from('students')
      .select('*')
      .eq('profile_id', profile.id)
      .single(),
    supabase
      .from('driving_schools')
      .select('name')
      .eq('id', profile.driving_school_id!)
      .single(),
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

  const [{ data: bookingRaw }, { data: pastExams }] = await Promise.all([
    supabase
      .from('exam_bookings')
      .select(`*, exam_sessions(exam_date, exam_center)`)
      .eq('student_id', student.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('mock_exams')
      .select('score, total_questions, passed, created_at')
      .eq('student_id', student.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const booking = bookingRaw as (ExamBookingWithDetails & { exam_sessions: { exam_date: string; exam_center: string } }) | null
  const trainingBadge = TRAINING_BADGE[student.training_status]
  const bestScore = pastExams && pastExams.length > 0
    ? Math.max(...pastExams.map((e) => e.score))
    : null

  return (
    <div className="space-y-6">
      {/* Welcome card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[#00853F] via-[#FDEF42] to-[#E31B23]" />
        <div className="px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{student.full_name}</h1>
            <p className="mt-0.5 text-sm text-gray-500">{schoolRaw?.name ?? 'Auto-école'}</p>
          </div>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${trainingBadge.className}`}>
            {trainingBadge.label}
          </span>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Groupe sanguin</p>
          <p className="mt-2 text-xl font-bold text-gray-900">{student.blood_type ?? '—'}</p>
          {!student.blood_type && (
            <p className="text-xs text-gray-400 mt-1">Non renseigné</p>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Document médical</p>
          <div className="mt-2">
            {student.medical_document_url ? (
              <a
                href={student.medical_document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-navy hover:underline"
              >
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

      {/* Mock exam results */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Examens blancs</h2>
          <Link
            href="/student/exams"
            className="text-sm font-medium text-navy hover:underline"
          >
            Passer un examen →
          </Link>
        </div>
        {!pastExams || pastExams.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-gray-400">Aucun examen blanc passé.</p>
            <Link href="/student/exams" className="mt-3 inline-block rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90 transition-colors">
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

      {/* Exam booking status */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Examen de conduite</h2>
        </div>
        {!booking ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-gray-400">
              {student.training_status === 'ready_for_exam'
                ? 'Vous êtes prêt ! Votre auto-école va bientôt demander une réservation.'
                : 'Aucune réservation d\'examen pour le moment.'}
            </p>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Statut de la réservation</p>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${BOOKING_BADGE[booking.status]}`}>
                {BOOKING_LABEL[booking.status]}
              </span>
            </div>
            {booking.status === 'approved' && booking.exam_sessions && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">Date de l&apos;examen</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(booking.exam_sessions.exam_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">Centre</p>
                  <p className="text-sm font-semibold text-gray-900">{booking.exam_sessions.exam_center}</p>
                </div>
              </>
            )}
            {booking.result && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-700">Résultat</p>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                  booking.result === 'passed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {booking.result === 'passed' ? 'Reçu' : 'Échoué'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
