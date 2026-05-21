import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/layout/DashboardShell'

const NAV_LINKS = [
  { href: '/admin',               label: 'Tableau de bord'   },
  { href: '/admin/auto-ecoles',   label: 'Auto-écoles'       },
  { href: '/admin/students',      label: 'Élèves'            },
  { href: '/admin/reservations',  label: 'Rendez-vous'       },
  { href: '/admin/exam-sessions', label: "Sessions d'examen" },
  { href: '/admin/exam-bookings', label: 'Réservations'      },
  { href: '/admin/results',       label: 'Résultats'         },
  { href: '/admin/audit-logs',    label: "Journaux d'audit"  },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (profile?.role !== 'super_admin') redirect('/login')

  return (
    <DashboardShell navLinks={NAV_LINKS} subtitle="Administration" homeHref="/admin">
      {children}
    </DashboardShell>
  )
}
