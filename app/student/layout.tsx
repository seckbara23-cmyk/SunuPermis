import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/layout/DashboardShell'
import InstallPrompt from '@/components/pwa/InstallPrompt'

const NAV_LINKS = [
  { href: '/student',          label: 'Mon espace'      },
  { href: '/student/learning', label: 'Apprentissage'   },
  { href: '/student/exams',    label: 'Examens blancs'  },
]

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, id')
    .eq('user_id', user.id)
    .single()

  if (profile?.role === 'super_admin')  redirect('/admin')
  if (profile?.role === 'school_admin') redirect('/dashboard')
  if (profile?.role !== 'student')      redirect('/login')

  // Check student account lifecycle status.
  // We render a blocking UI here instead of redirecting, because
  // /student/account-inactive lives inside this layout tree and would loop.
  if (profile?.id) {
    const { data: studentRecord } = await supabase
      .from('students')
      .select('account_status')
      .eq('profile_id', profile.id)
      .maybeSingle()

    if (
      studentRecord?.account_status === 'suspended' ||
      studentRecord?.account_status === 'archived'
    ) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm max-w-md w-full p-8 text-center">
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-gray-900 mb-2">Compte désactivé</h1>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Votre compte étudiant est actuellement désactivé. Veuillez contacter votre auto-école ou l&apos;administration SunuPermis.
            </p>
            <form method="POST" action="/auth/logout">
              <button
                type="submit"
                className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
              >
                Se déconnecter
              </button>
            </form>
          </div>
        </div>
      )
    }
  }

  return (
    <DashboardShell navLinks={NAV_LINKS} subtitle="Espace élève" homeHref="/student">
      <InstallPrompt />
      {children}
    </DashboardShell>
  )
}
