import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOpenExamSessions } from '@/services/exam-sessions'
import { getBookingsBySchool } from '@/services/exam-bookings'
import ExamBookingClient from './ExamBookingClient'
import type { Student } from '@/types'

export default async function DashboardExamsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, driving_school_id')
    .eq('user_id', user.id)
    .single()

  if (profile?.role !== 'school_admin') redirect('/login')

  const [sessions, bookings, { data: readyStudentsRaw }] = await Promise.all([
    getOpenExamSessions(),
    getBookingsBySchool(),
    supabase
      .from('students')
      .select('id, full_name, training_status')
      .eq('driving_school_id', profile.driving_school_id!)
      .eq('training_status', 'ready_for_exam')
      .order('full_name'),
  ])

  const readyStudents = (readyStudentsRaw ?? []) as Pick<Student, 'id' | 'full_name' | 'training_status'>[]

  return (
    <ExamBookingClient
      sessions={sessions}
      bookings={bookings}
      readyStudents={readyStudents}
    />
  )
}
