import { createClient } from '@/lib/supabase/server'
import type { ExamBookingWithDetails } from '@/types'

const SELECT_DETAILS = `
  *,
  students ( full_name, email, phone ),
  driving_schools ( name ),
  exam_sessions ( exam_date, exam_center, available_slots )
` as const

export async function getAllBookings(): Promise<ExamBookingWithDetails[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('exam_bookings')
    .select(SELECT_DETAILS)
    .order('created_at', { ascending: false })
  return (data ?? []) as ExamBookingWithDetails[]
}

export async function getBookingsBySchool(): Promise<ExamBookingWithDetails[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('exam_bookings')
    .select(SELECT_DETAILS)
    .order('created_at', { ascending: false })
  return (data ?? []) as ExamBookingWithDetails[]
}

export async function getStudentBooking(
  studentId: string
): Promise<ExamBookingWithDetails | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('exam_bookings')
    .select(SELECT_DETAILS)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data ?? null) as ExamBookingWithDetails | null
}

export async function getApprovedBookingsWithoutResult(): Promise<ExamBookingWithDetails[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('exam_bookings')
    .select(SELECT_DETAILS)
    .eq('status', 'approved')
    .is('result', null)
    .order('approved_at', { ascending: false })
  return (data ?? []) as ExamBookingWithDetails[]
}
