import { createClient } from '@/lib/supabase/server'
import type { ExamBookingWithDetails } from '@/types'
import ResultsClient from './ResultsClient'

export default async function ResultsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('exam_bookings')
    .select(`*, students(full_name, email), driving_schools(name), exam_sessions(exam_date, exam_center)`)
    .eq('status', 'approved')
    .order('approved_at', { ascending: false })
  return <ResultsClient initialBookings={(data ?? []) as ExamBookingWithDetails[]} />
}
