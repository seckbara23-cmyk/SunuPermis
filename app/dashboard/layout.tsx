import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/layout/DashboardShell'

const NAV_LINKS = [
  { href: '/dashboard',          label: 'Tableau de bord' },
  { href: '/dashboard/students', label: 'Élèves'          },
  { href: '/dashboard/exams',    label: 'Examens'         },
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (profile?.role === 'super_admin') redirect('/admin')
  if (profile?.role === 'student')     redirect('/student')
  if (profile?.role !== 'school_admin') redirect('/login')

  return (
    <DashboardShell navLinks={NAV_LINKS} subtitle="Auto-école" homeHref="/dashboard">
      {children}
    </DashboardShell>
  )
}
