import { createClient } from '@/lib/supabase/server'

export default async function DashboardHome() {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('driving_school_id')
    .eq('user_id', (await supabase.auth.getUser()).data.user!.id)
    .single()

  const schoolId = profile?.driving_school_id

  const [
    { count: totalStudents },
    { count: activeStudents },
    { count: readyStudents },
    { count: pendingBookings },
    { count: approvedBookings },
    { data: upcomingSessions },
    { data: school },
  ] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('driving_school_id', schoolId!),
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('driving_school_id', schoolId!).eq('training_status', 'in_training'),
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('driving_school_id', schoolId!).eq('training_status', 'ready_for_exam'),
    supabase.from('exam_bookings').select('*', { count: 'exact', head: true }).eq('driving_school_id', schoolId!).eq('status', 'pending'),
    supabase.from('exam_bookings').select('*', { count: 'exact', head: true }).eq('driving_school_id', schoolId!).eq('status', 'approved'),
    supabase.from('exam_sessions').select('exam_date, exam_center').eq('status', 'open').gte('exam_date', new Date().toISOString()).order('exam_date', { ascending: true }).limit(3),
    supabase.from('driving_schools').select('name').eq('id', schoolId!).single(),
  ])

  const stats = [
    { label: 'Total élèves',            value: totalStudents   ?? 0, accent: 'border-l-navy' },
    { label: 'En formation',            value: activeStudents  ?? 0, accent: 'border-l-indigo-400' },
    { label: 'Prêts pour l\'examen',    value: readyStudents   ?? 0, accent: 'border-l-amber-400' },
    { label: 'Réservations en attente', value: pendingBookings ?? 0, accent: 'border-l-amber-400' },
    { label: 'Examens approuvés',       value: approvedBookings ?? 0, accent: 'border-l-green-500' },
  ]

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[#00853F] via-[#FDEF42] to-[#E31B23]" />
        <div className="px-6 py-5">
          <h1 className="text-xl font-bold text-gray-900">{school?.name ?? 'Mon auto-école'}</h1>
          <p className="mt-1 text-sm text-gray-500">Tableau de bord de votre auto-école</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className={`bg-white rounded-xl border border-gray-200 border-l-4 ${s.accent} shadow-sm px-6 py-5`}>
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Upcoming sessions */}
      {upcomingSessions && upcomingSessions.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Prochaines sessions d&apos;examen</h2>
          <div className="space-y-2">
            {upcomingSessions.map((s, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(s.exam_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.exam_center}</p>
                </div>
                <span className="text-xs font-medium text-navy bg-navy/10 rounded-full px-3 py-1">
                  {new Date(s.exam_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
