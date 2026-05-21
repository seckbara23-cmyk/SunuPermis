import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const ONBOARDING_STEPS = [
  {
    title: 'Ajouter votre premier élève',
    description: 'Inscrivez un élève pour commencer la gestion des dossiers et des paiements.',
    href: '/dashboard/students',
  },
  {
    title: 'Ajouter un moniteur',
    description: 'Enregistrez les moniteurs de votre auto-école pour planifier les leçons.',
    href: '/dashboard/instructors',
  },
  {
    title: 'Créer une demande de rendez-vous',
    description: 'Soumettez une demande de rendez-vous d\'examen auprès de l\'administration.',
    href: '/dashboard/appointments',
  },
  {
    title: 'Configurer les informations de l\'auto-école',
    description: 'Vérifiez et complétez les informations de votre établissement.',
    href: '/dashboard/schools',
  },
]

function OnboardingView({ schoolName }: { schoolName: string }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[#00853F] via-[#FDEF42] to-[#E31B23]" />
        <div className="px-6 py-5">
          <h1 className="text-xl font-bold text-gray-900">{schoolName}</h1>
          <p className="mt-1 text-sm text-gray-500">Tableau de bord de votre auto-école</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Bienvenue dans SunuPermis !</h2>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Votre auto-école est enregistrée. Suivez ces étapes pour bien démarrer et tirer le meilleur de la plateforme.
        </p>

        <div className="space-y-3">
          {ONBOARDING_STEPS.map((step, i) => (
            <Link
              key={i}
              href={step.href}
              className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:border-navy/30 hover:bg-navy/5 transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-navy/20 transition-colors">
                <span className="text-sm font-semibold text-navy">{i + 1}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">{step.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.description}</p>
              </div>
              <svg
                className="w-4 h-4 text-gray-300 shrink-0 mt-0.5 group-hover:text-navy transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
        <p className="text-sm text-amber-800 leading-relaxed">
          <span className="font-semibold">Conseil :</span> Commencez par ajouter vos élèves existants.
          Le tableau de bord affichera vos statistiques dès que des données seront enregistrées.
        </p>
      </div>
    </div>
  )
}

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

  if ((totalStudents ?? 0) === 0) {
    return <OnboardingView schoolName={school?.name ?? 'Mon auto-école'} />
  }

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
