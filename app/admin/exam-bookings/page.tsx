import { createClient } from '@/lib/supabase/server'
import type { ExamBookingWithDetails } from '@/types'
import ExamBookingsClient from './ExamBookingsClient'

export default async function ExamBookingsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('exam_bookings')
    .select(`*, students(full_name, email, phone), driving_schools(name), exam_sessions(exam_date, exam_center, available_slots)`)
    .order('created_at', { ascending: false })
  return <ExamBookingsClient initialBookings={(data ?? []) as ExamBookingWithDetails[]} />
}
