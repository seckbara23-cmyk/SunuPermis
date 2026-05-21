import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/layout/DashboardShell'

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
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (profile?.role === 'super_admin')  redirect('/admin')
  if (profile?.role === 'school_admin') redirect('/dashboard')
  if (profile?.role !== 'student')      redirect('/login')

  return (
    <DashboardShell navLinks={NAV_LINKS} subtitle="Espace élève" homeHref="/student">
      {children}
    </DashboardShell>
  )
}
