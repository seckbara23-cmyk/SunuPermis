import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StudentSidebar from '@/components/layout/StudentSidebar'
import Header from '@/components/layout/Header'

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
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <div className="h-1 shrink-0 bg-gradient-to-r from-[#00853F] via-[#FDEF42] to-[#E31B23]" />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <StudentSidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
