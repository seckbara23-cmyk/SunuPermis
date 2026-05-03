import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profile?.role === 'student') {
      redirect('/dashboard/appointments')
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[#00853F] via-[#FDEF42] to-[#E31B23]" />
        <div className="px-6 py-5">
          <h1 className="text-xl font-bold text-gray-900">Bienvenue sur SunuPermis</h1>
          <p className="mt-1 text-sm text-gray-500">
            Suivez vos rendez-vous, vos leçons et votre préparation au code en toute simplicité.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div>
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">Vue d&apos;ensemble</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: 'Total élèves',         value: '—', accent: 'border-l-navy' },
          { label: 'Élèves actifs',         value: '—', accent: 'border-l-indigo-400' },
          { label: 'Leçons à venir',        value: '—', accent: 'border-l-indigo-400' },
          { label: "Prêts pour l'examen",  value: '—', accent: 'border-l-amber-400' },
          { label: 'Examens passés',        value: '—', accent: 'border-l-green-500' },
          { label: 'Paiements en attente',  value: '—', accent: 'border-l-red-400' },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`bg-white rounded-xl border border-gray-200 border-l-4 ${stat.accent} shadow-sm px-6 py-5`}
          >
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
        </div>
      </div>
    </div>
  )
}
