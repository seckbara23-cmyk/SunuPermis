'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { notifyBookingApproved, notifyBookingRejected } from '@/services/notifications'
import { logAuditEvent } from '@/lib/audit'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, profile: null, error: 'Non authentifié.' }

  const { data: profile } = await supabase
    .from('profiles').select('id, role').eq('user_id', user.id).single()

  if (profile?.role !== 'super_admin') return { supabase, user, profile: null, error: 'Accès refusé.' }
  return { supabase, user, profile, error: null }
}

export async function approveBooking(bookingId: string): Promise<{ error?: string }> {
  const { supabase, user, profile, error } = await requireAdmin()
  if (error || !user || !profile) return { error: error ?? 'Accès refusé.' }

  // Fetch booking details for notifications + audit
  const { data: booking } = await supabase
    .from('exam_bookings')
    .select(`
      id,
      driving_school_id,
      student_id,
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

  const bk = booking as unknown as {
    driving_school_id: string
    student_id: string
    students: { email: string; phone?: string | null }
    driving_schools: { email: string }
    exam_sessions: { exam_date: string; exam_center: string }
  } | null

  await logAuditEvent({
    actorProfileId: profile.id,
    actorUserId:    user.id,
    actorRole:      'super_admin',
    action:         'booking.approved',
    entityType:     'exam_booking',
    entityId:       bookingId,
    metadata: {
      driving_school_id: bk?.driving_school_id,
      student_id:        bk?.student_id,
      exam_date:         bk?.exam_sessions?.exam_date,
      exam_center:       bk?.exam_sessions?.exam_center,
    },
  })

  if (bk) {
    await notifyBookingApproved({
      studentEmail:  bk.students.email,
      studentPhone:  bk.students.phone,
      schoolEmail:   bk.driving_schools.email,
      examDate:      bk.exam_sessions.exam_date,
      examCenter:    bk.exam_sessions.exam_center,
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
  const { supabase, user, profile, error } = await requireAdmin()
  if (error || !user || !profile) return { error: error ?? 'Accès refusé.' }

  const { data: booking } = await supabase
    .from('exam_bookings')
    .select(`
      driving_school_id,
      student_id,
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

  const bk = booking as unknown as {
    driving_school_id: string
    student_id: string
    students: { email: string }
    driving_schools: { email: string }
    exam_sessions: { exam_date: string; exam_center: string }
  } | null

  await logAuditEvent({
    actorProfileId: profile.id,
    actorUserId:    user.id,
    actorRole:      'super_admin',
    action:         'booking.rejected',
    entityType:     'exam_booking',
    entityId:       bookingId,
    metadata: {
      driving_school_id: bk?.driving_school_id,
      student_id:        bk?.student_id,
      exam_date:         bk?.exam_sessions?.exam_date,
    },
  })

  if (bk) {
    await notifyBookingRejected({
      studentEmail: bk.students.email,
      schoolEmail:  bk.driving_schools.email,
      examDate:     bk.exam_sessions.exam_date,
      examCenter:   bk.exam_sessions.exam_center,
    })
  }

  revalidatePath('/admin/exam-bookings')
  revalidatePath('/dashboard/exams')
  return {}
}
