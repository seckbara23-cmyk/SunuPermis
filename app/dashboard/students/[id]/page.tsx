import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStudentById } from '@/services/students'
import StudentDetail from '@/components/students/StudentDetail'
import type { UserRole } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function StudentDetailPage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [student, { data: profile }] = await Promise.all([
    getStudentById(id),
    supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single(),
  ])

  if (!student) notFound()

  const role = (profile?.role ?? 'student') as UserRole
  const canUpdate = role === 'school_admin' || role === 'super_admin'

  return <StudentDetail student={student} canUpdate={canUpdate} role={role} />
}
