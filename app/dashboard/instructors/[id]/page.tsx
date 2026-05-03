import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getInstructorById } from '@/services/instructors'
import InstructorDetail from '@/components/instructors/InstructorDetail'
import type { UserRole } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function InstructorDetailPage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [instructor, { data: profile }] = await Promise.all([
    getInstructorById(id),
    supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single(),
  ])

  if (!instructor) notFound()

  const role = (profile?.role ?? 'instructor') as UserRole
  const canUpdate = role === 'school_admin' || role === 'super_admin'

  return <InstructorDetail instructor={instructor} canUpdate={canUpdate} />
}
