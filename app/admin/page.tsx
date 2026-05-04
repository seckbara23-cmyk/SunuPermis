import { createClient } from '@/lib/supabase/server'

async function getStats(supabase: Awaited<ReturnType<typeof createClient>>) {
  const [
    { count: totalSchools },
    { count: pendingSchools },
    { count: totalStudents },
    { count: readyStudents },
    { count: pendingBookings },
    { count: openSessions },
    { data: resultData },
  ] = await Promise.all([
    supabase.from('driving_schools').select('*', { count: 'exact', head: true }),
    supabase.from('driving_schools').select('*', { count: 'exact', head: true }).eq('approval_status', 'pending'),
    supabase.from('students').select('*', { count: 'exact', head: true }),
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('training_status', 'ready_for_exam'),
    supabase.from('exam_bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('exam_sessions').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('exam_bookings').select('result').not('result', 'is', null),
  ])

  const results  = resultData ?? []
  const total    = results.length
  const passed   = results.filter((r) => r.result === 'passed').length
  const passRate = total > 0 ? Math.round((passed / total) * 100) : null

  return {
    totalSchools:   totalSchools  ?? 0,
    pendingSchools: pendingSchools ?? 0,
    totalStudents:  totalStudents ?? 0,
    readyStudents:  readyStudents ?? 0,
    pendingBookings: pendingBookings ?? 0,
    openSessions:   openSessions ?? 0,
    passRate,
  }
}

export default async function AdminDashboard() {
  const supabase = await createClient()
  const stats = await getStats(supabase)

  const statCards = [
    { label: 'Auto-écoles',          value: stats.totalSchools,    accent: 'border-l-navy' },
    { label: 'En attente d\'approbation', value: stats.pendingSchools, accent: 'border-l-amber-400' },
    { label: 'Élèves total',         value: stats.totalStudents,   accent: 'border-l-indigo-400' },
    { label: 'Prêts pour l\'examen', value: stats.readyStudents,   accent: 'border-l-green-500' },
    { label: 'Réservations en attente', value: stats.pendingBookings, accent: 'border-l-amber-400' },
    { label: 'Sessions ouvertes',    value: stats.openSessions,    accent: 'border-l-indigo-400' },
    { label: 'Taux de réussite',     value: stats.passRate !== null ? `${stats.passRate}%` : '—', accent: 'border-l-green-500' },
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
          <div
            key={s.label}
            className={`bg-white rounded-xl border border-gray-200 border-l-4 ${s.accent} shadow-sm px-6 py-5`}
          >
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
