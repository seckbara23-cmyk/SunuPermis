'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { notifyBookingApproved, notifyBookingRejected } from '@/services/notifications'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, error: 'Non authentifié.' }

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('user_id', user.id).single()

  if (profile?.role !== 'super_admin') return { supabase, error: 'Accès refusé.' }
  return { supabase, error: null }
}

export async function approveBooking(bookingId: string): Promise<{ error?: string }> {
  const { supabase, error } = await requireAdmin()
  if (error) return { error }

  // Fetch booking details for notifications
  const { data: booking } = await supabase
    .from('exam_bookings')
    .select(`
      id,
      students ( full_name, email, phone ),
      driving_schools ( name, email ),
      exam_sessions ( exam_date, exam_center )
    `)
    .eq('id', bookingId)
    .single()

  const { error: dbErr } = await supabase
    .from('exam_bookings')
    .update({ status: 'approved', approved_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', bookingId)

  if (dbErr) return { error: dbErr.message }

  // Fire placeholder notifications
  if (booking) {
    const student = booking.students as unknown as { email: string; phone?: string | null }
    const school  = booking.driving_schools as unknown as { email: string }
    const session = booking.exam_sessions as unknown as { exam_date: string; exam_center: string }
    await notifyBookingApproved({
      studentEmail:  student.email,
      studentPhone:  student.phone,
      schoolEmail:   school.email,
      examDate:      session.exam_date,
      examCenter:    session.exam_center,
      bookingId,
    })
  }

  revalidatePath('/admin/exam-bookings')
  revalidatePath('/dashboard/exams')
  return {}
}

export async function rejectBooking(
  bookingId: string
): Promise<{ error?: string }> {
  const { supabase, error } = await requireAdmin()
  if (error) return { error }

  const { data: booking } = await supabase
    .from('exam_bookings')
    .select(`
      students ( email ),
      driving_schools ( email ),
      exam_sessions ( exam_date, exam_center )
    `)
    .eq('id', bookingId)
    .single()

  const { error: dbErr } = await supabase
    .from('exam_bookings')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', bookingId)

  if (dbErr) return { error: dbErr.message }

  if (booking) {
    const student = booking.students as unknown as { email: string }
    const school  = booking.driving_schools as unknown as { email: string }
    const session = booking.exam_sessions as unknown as { exam_date: string; exam_center: string }
    await notifyBookingRejected({
      studentEmail: student.email,
      schoolEmail:  school.email,
      examDate:     session.exam_date,
      examCenter:   session.exam_center,
    })
  }

  revalidatePath('/admin/exam-bookings')
  revalidatePath('/dashboard/exams')
  return {}
}
