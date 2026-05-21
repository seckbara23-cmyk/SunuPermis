import { createClient } from '@/lib/supabase/server'
import { notifyAppointmentConfirmed, notifyAppointmentRejected } from '@/services/notifications'
import { logAuditEvent } from '@/lib/audit'
import type { AppointmentWithStudent, AppointmentWithDetails } from '@/types'

// ── Selects ────────────────────────────────────────────────────────────────────

const APPOINTMENT_SELECT_SCHOOL = `
  id, student_id, driving_school_id, requested_by, exam_session_id,
  scheduled_at, status, rejection_reason, confirmed_by, confirmed_at,
  requested_at, approved_at, approved_by, rejected_at, rejected_by,
  updated_at, created_at,
  students(full_name)
` as const

const APPOINTMENT_SELECT_ADMIN = `
  id, student_id, driving_school_id, requested_by, exam_session_id,
  scheduled_at, status, rejection_reason, confirmed_by, confirmed_at,
  requested_at, approved_at, approved_by, rejected_at, rejected_by,
  updated_at, created_at,
  students(full_name),
  driving_schools(name)
` as const

// ── Mutation: create appointment request (school_admin) ────────────────────────

export async function createAppointmentRequest(
  studentId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, driving_school_id')
    .eq('user_id', user.id)
    .single()

  if (!profile || profile.role !== 'school_admin') return { error: 'Accès refusé.' }
  if (!profile.driving_school_id) return { error: 'Aucune auto-école liée à ce compte.' }

  const { data: student } = await supabase
    .from('students')
    .select('id, training_status')
    .eq('id', studentId)
    .eq('driving_school_id', profile.driving_school_id)
    .single()

  if (!student) return { error: "Élève introuvable dans votre auto-école." }
  if (student.training_status !== 'ready_for_exam') {
    return { error: "Cet élève n'est pas encore prêt pour l'examen." }
  }

  const { data: existing } = await supabase
    .from('appointments')
    .select('id')
    .eq('student_id', studentId)
    .in('status', ['pending', 'confirmed'])
    .maybeSingle()

  if (existing) return { error: "Cet élève a déjà un rendez-vous en attente ou confirmé." }

  const now = new Date().toISOString()
  const { data: inserted, error } = await supabase
    .from('appointments')
    .insert({
      student_id:        studentId,
      driving_school_id: profile.driving_school_id,
      requested_by:      profile.id,
      status:            'pending',
      requested_at:      now,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  await logAuditEvent({
    actorProfileId: profile.id,
    actorUserId:    user.id,
    actorRole:      'school_admin',
    action:         'appointment.requested',
    entityType:     'appointment',
    entityId:       inserted.id,
    metadata: {
      driving_school_id: profile.driving_school_id,
      student_id:        studentId,
      requested_by:      profile.id,
    },
  })

  return {}
}

// ── Mutation: approve appointment (super_admin) ────────────────────────────────

export async function approveAppointment(
  appointmentId: string,
  scheduledAt: string
): Promise<{ error?: string }> {
  if (!scheduledAt) return { error: 'La date du rendez-vous est obligatoire.' }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('user_id', user.id)
    .single()

  if (!profile || profile.role !== 'super_admin') return { error: 'Accès refusé.' }

  // Fetch current state for audit metadata
  const { data: current } = await supabase
    .from('appointments')
    .select('status, student_id, driving_school_id')
    .eq('id', appointmentId)
    .single()

  const previousStatus = current?.status ?? 'unknown'
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('appointments')
    .update({
      status:           'confirmed',
      scheduled_at:     scheduledAt,
      confirmed_by:     profile.id,
      confirmed_at:     now,
      approved_at:      now,
      approved_by:      profile.id,
      rejection_reason: null,
      rejected_at:      null,
      rejected_by:      null,
    })
    .eq('id', appointmentId)

  if (error) return { error: error.message }

  await logAuditEvent({
    actorProfileId: profile.id,
    actorUserId:    user.id,
    actorRole:      'super_admin',
    action:         'appointment.approved',
    entityType:     'appointment',
    entityId:       appointmentId,
    metadata: {
      driving_school_id: current?.driving_school_id,
      student_id:        current?.student_id,
      previous_status:   previousStatus,
      new_status:        'confirmed',
      scheduled_at:      scheduledAt,
    },
  })

  // Best-effort notification
  try {
    const { data: appt } = await supabase
      .from('appointments')
      .select('scheduled_at, students(full_name, email, phone)')
      .eq('id', appointmentId)
      .single()

    if (appt?.students) {
      const s = appt.students as unknown as { full_name: string; email: string; phone: string | null }
      await notifyAppointmentConfirmed({
        studentEmail: s.email,
        studentPhone: s.phone,
        studentName:  s.full_name,
        schoolName:   '',
        scheduledAt:  appt.scheduled_at ?? scheduledAt,
      })
    }
  } catch { /* non-fatal */ }

  return {}
}

// ── Mutation: reject appointment (super_admin) ─────────────────────────────────

export async function rejectAppointment(
  appointmentId: string,
  reason: string
): Promise<{ error?: string }> {
  if (!reason.trim()) return { error: 'La raison du rejet est obligatoire.' }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('user_id', user.id)
    .single()

  if (!profile || profile.role !== 'super_admin') return { error: 'Accès refusé.' }

  const { data: current } = await supabase
    .from('appointments')
    .select('status, student_id, driving_school_id')
    .eq('id', appointmentId)
    .single()

  const previousStatus = current?.status ?? 'unknown'
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('appointments')
    .update({
      status:           'rejected',
      rejection_reason: reason.trim(),
      rejected_at:      now,
      rejected_by:      profile.id,
      scheduled_at:     null,
      confirmed_by:     null,
      confirmed_at:     null,
      approved_at:      null,
      approved_by:      null,
    })
    .eq('id', appointmentId)

  if (error) return { error: error.message }

  await logAuditEvent({
    actorProfileId: profile.id,
    actorUserId:    user.id,
    actorRole:      'super_admin',
    action:         'appointment.rejected',
    entityType:     'appointment',
    entityId:       appointmentId,
    metadata: {
      driving_school_id: current?.driving_school_id,
      student_id:        current?.student_id,
      previous_status:   previousStatus,
      new_status:        'rejected',
      rejection_reason:  reason.trim(),
    },
  })

  // Best-effort notification
  try {
    const { data: appt } = await supabase
      .from('appointments')
      .select('students(full_name, email)')
      .eq('id', appointmentId)
      .single()

    if (appt?.students) {
      const s = appt.students as unknown as { full_name: string; email: string }
      await notifyAppointmentRejected({
        studentEmail:    s.email,
        studentName:     s.full_name,
        rejectionReason: reason.trim(),
      })
    }
  } catch { /* non-fatal */ }

  return {}
}

// ── Mutation: cancel appointment (super_admin) ─────────────────────────────────

export async function cancelAppointment(
  appointmentId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('user_id', user.id)
    .single()

  if (!profile || profile.role !== 'super_admin') return { error: 'Accès refusé.' }

  const { error } = await supabase
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', appointmentId)

  if (error) return { error: error.message }

  return {}
}

// ── Queries ────────────────────────────────────────────────────────────────────

export async function getAppointmentsForSchool(
  schoolId: string
): Promise<AppointmentWithStudent[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('appointments')
    .select(APPOINTMENT_SELECT_SCHOOL)
    .eq('driving_school_id', schoolId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as AppointmentWithStudent[]
}

export async function getAllAppointments(): Promise<AppointmentWithDetails[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('appointments')
    .select(APPOINTMENT_SELECT_ADMIN)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as AppointmentWithDetails[]
}

export async function getAppointmentForStudent(
  studentId: string
): Promise<AppointmentWithStudent | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('appointments')
    .select(APPOINTMENT_SELECT_SCHOOL)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) return null
  return data as unknown as AppointmentWithStudent | null
}

export async function getEligibleStudents(
  schoolId: string
): Promise<{ id: string; full_name: string }[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('students')
    .select('id, full_name')
    .eq('driving_school_id', schoolId)
    .eq('training_status', 'ready_for_exam')
    .order('full_name')
  if (error) throw new Error(error.message)
  return data ?? []
}
