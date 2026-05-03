import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getInstructors, getDrivingSchoolsForInstructors } from '@/services/instructors'
import InstructorsClient from '@/components/instructors/InstructorsClient'
import type { UserRole } from '@/types'

export default async function InstructorsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, driving_school_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/login')

  const role = profile.role as UserRole
  const canAdd = role === 'school_admin' || role === 'super_admin'

  const [instructors, drivingSchools] = await Promise.all([
    getInstructors(),
    role === 'super_admin' ? getDrivingSchoolsForInstructors() : Promise.resolve([]),
  ])

  return (
    <InstructorsClient
      instructors={instructors}
      canAdd={canAdd}
      role={role}
      drivingSchools={drivingSchools}
    />
  )
}
