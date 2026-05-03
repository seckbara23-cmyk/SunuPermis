import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStudents, getDrivingSchools } from '@/services/students'
import StudentsClient from '@/components/students/StudentsClient'
import type { UserRole } from '@/types'

export default async function StudentsPage() {
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

  // Fetch in parallel — RLS scopes students automatically
  // getDrivingSchools only matters for super_admin (school_admin sees just theirs, not shown)
  const [students, drivingSchools] = await Promise.all([
    getStudents(),
    role === 'super_admin' ? getDrivingSchools() : Promise.resolve([]),
  ])

  return (
    <StudentsClient
      students={students}
      canAdd={canAdd}
      role={role}
      drivingSchools={drivingSchools}
    />
  )
}
