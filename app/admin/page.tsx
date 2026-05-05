import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

async function getStats(supabase: Awaited<ReturnType<typeof createClient>>) {
  const [
    { count: totalSchools },
    { count: pendingSchools },
    { count: totalStudents },
    { count: readyStudents },
    { count: pendingAppointments },
    { count: confirmedAppointments },
    { count: openSessions },
    { count: studentsWithDoc },
    { count: studentsWithoutDoc },
    { count: activeAppointments },
    { count: passedMockExams },
    { data: resultData },
  ] = await Promise.all([
    supabase.from('driving_schools').select('*', { count: 'exact', head: true }),
    supabase.from('driving_schools').select('*', { count: 'exact', head: true }).eq('approval_status', 'pending'),
    supabase.from('students').select('*', { count: 'exact', head: true }),
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('training_status', 'ready_for_exam'),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
    supabase.from('exam_sessions').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('students').select('*', { count: 'exact', head: true }).not('medical_document_url', 'is', null),
    supabase.from('students').select('*', { count: 'exact', head: true }).is('medical_document_url', null),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).neq('status', 'cancelled'),
    supabase.from('mock_exams').select('*', { count: 'exact', head: true }).eq('passed', true),
    supabase.from('exam_bookings').select('result').not('result', 'is', null),
  ])

  const results  = resultData ?? []
  const total    = results.length
  const passed   = results.filter((r) => r.result === 'passed').length
  const passRate = total > 0 ? Math.round((passed / total) * 100) : null

  return {
    totalSchools:          totalSchools         ?? 0,
    pendingSchools:        pendingSchools        ?? 0,
    totalStudents:         totalStudents         ?? 0,
    readyStudents:         readyStudents         ?? 0,
    pendingAppointments:   pendingAppointments   ?? 0,
    confirmedAppointments: confirmedAppointments ?? 0,
    openSessions:          openSessions          ?? 0,
    studentsWithDoc:       studentsWithDoc       ?? 0,
    studentsWithoutDoc:    studentsWithoutDoc    ?? 0,
    activeAppointments:    activeAppointments    ?? 0,
    passedMockExams:       passedMockExams       ?? 0,
    passRate,
  }
}

export default async function AdminDashboard() {
  const supabase = await createClient()
  const stats = await getStats(supabase)

  const kpiCards = [
    { label: 'Auto-écoles',              value: stats.totalSchools,        accent: 'border-l-navy',       href: '/admin/auto-ecoles' },
    { label: "En attente d'approbation", value: stats.pendingSchools,      accent: 'border-l-amber-400',  href: '/admin/auto-ecoles?status=pending' },
    { label: 'Élèves total',             value: stats.totalStudents,       accent: 'border-l-indigo-400', href: '/admin/students' },
    { label: "Prêts pour l'examen",      value: stats.readyStudents,       accent: 'border-l-green-500',  href: '/admin/students?status=ready' },
    { label: 'Réservations en attente',  value: stats.pendingAppointments, accent: 'border-l-amber-400',  href: '/admin/reservations?status=pending' },
    { label: 'Sessions ouvertes',        value: stats.openSessions,        accent: 'border-l-indigo-400', href: '/admin/exam-sessions' },
    { label: 'Taux de réussite',         value: stats.passRate !== null ? `${stats.passRate}%` : '—', accent: 'border-l-green-500', href: '/admin/results' },
  ]

  const pipeline = [
    { label: 'Inscrits',          value: stats.totalStudents,         href: '/admin/students' },
    { label: 'Docs médicaux',     value: stats.studentsWithDoc,        href: '/admin/students' },
    { label: 'RDV soumis',        value: stats.activeAppointments,     href: '/admin/reservations?status=all' },
    { label: 'RDV validés',       value: stats.confirmedAppointments,  href: '/admin/reservations?status=confirmed' },
    { label: 'Examens réussis',   value: stats.passedMockExams,        href: '/admin/results' },
  ]

  const actions = [
    stats.pendingSchools > 0 && {
      label: `${stats.pendingSchools} auto-école${stats.pendingSchools > 1 ? 's' : ''} en attente d'approbation`,
      href: '/admin/auto-ecoles?status=pending',
      urgent: true,
    },
    stats.pendingAppointments > 0 && {
      label: `${stats.pendingAppointments} rendez-vous en attente de décision`,
      href: '/admin/reservations?status=pending',
      urgent: true,
    },
    stats.studentsWithoutDoc > 0 && {
      label: `${stats.studentsWithoutDoc} élève${stats.studentsWithoutDoc > 1 ? 's' : ''} sans document médical`,
      href: '/admin/students',
      urgent: false,
    },
    stats.openSessions > 0 && {
      label: `${stats.openSessions} session${stats.openSessions > 1 ? 's' : ''} d'examen ouverte${stats.openSessions > 1 ? 's' : ''}`,
      href: '/admin/exam-sessions',
      urgent: false,
    },
  ].filter(Boolean) as { label: string; href: string; urgent: boolean }[]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[#00853F] via-[#FDEF42] to-[#E31B23]" />
        <div className="px-6 py-5">
          <h1 className="text-xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="mt-1 text-sm text-gray-500">Vue d&apos;ensemble de la plateforme SunuPermis</p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {kpiCards.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className={`group bg-white rounded-xl border border-gray-200 border-l-4 ${s.accent} shadow-sm px-6 py-5 hover:shadow-md hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-navy/30 transition-all`}
          >
            <p className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">{s.label}</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{s.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Pipeline funnel */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Pipeline de formation</h2>
            <p className="text-xs text-gray-400 mt-0.5">Progression des élèves vers l&apos;examen</p>
          </div>
          <div className="px-6 py-5">
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {pipeline.map((step, i) => (
                <div key={step.label} className="flex items-center shrink-0">
                  <Link
                    href={step.href}
                    className="flex flex-col items-center gap-1.5 group"
                  >
                    <span className="text-2xl font-bold text-gray-900 group-hover:text-navy transition-colors">
                      {step.value}
                    </span>
                    <span className="text-xs text-gray-500 whitespace-nowrap group-hover:text-gray-700 transition-colors">
                      {step.label}
                    </span>
                  </Link>
                  {i < pipeline.length - 1 && (
                    <svg className="w-5 h-5 text-gray-300 mx-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions à traiter */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Actions à traiter</h2>
            {actions.length > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">{actions.length} élément{actions.length > 1 ? 's' : ''}</p>
            )}
          </div>
          <div className="px-6 py-4">
            {actions.length === 0 ? (
              <p className="text-sm text-gray-400">Aucune action requise.</p>
            ) : (
              <ul className="space-y-2.5">
                {actions.map((action) => (
                  <li key={action.href + action.label}>
                    <Link
                      href={action.href}
                      className="flex items-start gap-2.5 group"
                    >
                      <span className={`mt-1 flex h-2 w-2 shrink-0 rounded-full ${action.urgent ? 'bg-amber-400' : 'bg-gray-300'}`} />
                      <span className="text-sm text-gray-700 group-hover:text-navy transition-colors leading-snug">
                        {action.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
