import { createClient } from '@/lib/supabase/server'
import type { ExamBookingWithDetails } from '@/types'
import type { AppointmentConfirmationData } from '@/services/appointments'

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

// Returns booking data shaped as AppointmentConfirmationData so ConvocationCard
// can render it. confirmation_reference is generated deterministically from the
// booking UUID (format BK-YYYY-XXXXXX) since exam_bookings has no native ref field.
export async function getBookingConfirmation(
  bookingId: string
): Promise<AppointmentConfirmationData | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('exam_bookings')
    .select(`
      id, status, approved_at, driving_school_id,
      students ( full_name, license_category ),
      driving_schools ( name ),
      exam_sessions ( exam_date, exam_center )
    `)
    .eq('id', bookingId)
    .eq('status', 'approved')
    .maybeSingle()

  if (!data) return null

  const d = data as unknown as {
    id: string
    status: string
    approved_at: string | null
    driving_school_id: string
    students: { full_name: string; license_category: string } | { full_name: string; license_category: string }[]
    driving_schools: { name: string } | { name: string }[]
    exam_sessions: { exam_date: string; exam_center: string } | null
  }

  const year = new Date(d.approved_at ?? Date.now()).getFullYear()
  const hex  = bookingId.replace(/-/g, '').slice(0, 6).toUpperCase()

  return {
    id:                     d.id,
    status:                 d.status,
    scheduled_at:           d.exam_sessions?.exam_date ?? null,
    exam_location:          d.exam_sessions?.exam_center ?? null,
    confirmation_reference: `BK-${year}-${hex}`,
    confirmed_at:           d.approved_at ?? null,
    driving_school_id:      d.driving_school_id,
    students:               Array.isArray(d.students)       ? d.students[0]       : d.students,
    driving_schools:        Array.isArray(d.driving_schools) ? d.driving_schools[0] : d.driving_schools,
  }
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
