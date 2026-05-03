import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getLessons, getStudentsForLesson, getActiveInstructorsForLesson } from '@/services/lessons'
import LessonsClient from '@/components/lessons/LessonsClient'
import type { UserRole } from '@/types'

export default async function LessonsPage() {
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
  const schoolId = role === 'school_admin' ? profile.driving_school_id : null

  const [lessons, students, instructors] = await Promise.all([
    getLessons(schoolId),
    canAdd ? getStudentsForLesson(schoolId) : Promise.resolve([]),
    canAdd ? getActiveInstructorsForLesson(schoolId) : Promise.resolve([]),
  ])

  return (
    <LessonsClient
      lessons={lessons}
      canAdd={canAdd}
      role={role}
      students={students}
      instructors={instructors}
    />
  )
}
