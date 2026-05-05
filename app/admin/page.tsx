import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

async function getStats(supabase: Awaited<ReturnType<typeof createClient>>) {
  const [
    { count: totalSchools },
    { count: pendingSchools },
    { count: totalStudents },
    { count: readyStudents },
    { count: pendingAppointments },
    { count: openSessions },
    { data: resultData },
  ] = await Promise.all([
    supabase.from('driving_schools').select('*', { count: 'exact', head: true }),
    supabase.from('driving_schools').select('*', { count: 'exact', head: true }).eq('approval_status', 'pending'),
    supabase.from('students').select('*', { count: 'exact', head: true }),
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('training_status', 'ready_for_exam'),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('exam_sessions').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('exam_bookings').select('result').not('result', 'is', null),
  ])

  const results  = resultData ?? []
  const total    = results.length
  const passed   = results.filter((r) => r.result === 'passed').length
  const passRate = total > 0 ? Math.round((passed / total) * 100) : null

  return {
    totalSchools:        totalSchools       ?? 0,
    pendingSchools:      pendingSchools     ?? 0,
    totalStudents:       totalStudents      ?? 0,
    readyStudents:       readyStudents      ?? 0,
    pendingAppointments: pendingAppointments ?? 0,
    openSessions:        openSessions       ?? 0,
    passRate,
  }
}

export default async function AdminDashboard() {
  const supabase = await createClient()
  const stats = await getStats(supabase)

  const statCards = [
    { label: 'Auto-écoles',              value: stats.totalSchools,        accent: 'border-l-navy',       href: '/admin/auto-ecoles' },
    { label: "En attente d'approbation", value: stats.pendingSchools,      accent: 'border-l-amber-400',  href: '/admin/auto-ecoles?status=pending' },
    { label: 'Élèves total',             value: stats.totalStudents,       accent: 'border-l-indigo-400', href: '/admin/students' },
    { label: "Prêts pour l'examen",      value: stats.readyStudents,       accent: 'border-l-green-500',  href: '/admin/students?status=ready' },
    { label: 'Réservations en attente',  value: stats.pendingAppointments, accent: 'border-l-amber-400',  href: '/admin/reservations?status=pending' },
    { label: 'Sessions ouvertes',        value: stats.openSessions,        accent: 'border-l-indigo-400', href: '/admin/exam-sessions' },
    { label: 'Taux de réussite',         value: stats.passRate !== null ? `${stats.passRate}%` : '—', accent: 'border-l-green-500', href: '/admin/results' },
  ]

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[#00853F] via-[#FDEF42] to-[#E31B23]" />
        <div className="px-6 py-5">
          <h1 className="text-xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="mt-1 text-sm text-gray-500">Vue d&apos;ensemble de la plateforme SunuPermis</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {statCards.map((s) => (
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
    </div>
  )
}
