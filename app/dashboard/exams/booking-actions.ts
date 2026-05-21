'use server'

import { createClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/audit'
import { revalidatePath } from 'next/cache'

function parseBookingError(message: string): string {
  if (message.includes('CAPACITY_EXCEEDED')) {
    return 'Cette session est complète. Aucune place disponible pour le moment.'
  }
  if (message.includes('SESSION_NOT_FOUND')) {
    return "La session d'examen sélectionnée est introuvable."
  }
  return "Une erreur est survenue lors de la réservation. Veuillez réessayer."
}

export async function requestExamBooking(
  studentId: string,
  sessionId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, driving_school_id')
    .eq('user_id', user.id)
    .single()

  if (profile?.role !== 'school_admin') return { error: 'Accès refusé.' }
  if (!profile.driving_school_id) return { error: 'Aucune auto-école liée à ce compte.' }

  // Verify student belongs to this school and is ready
  const { data: student } = await supabase
    .from('students')
    .select('id, training_status, driving_school_id')
    .eq('id', studentId)
    .single()

  if (!student) return { error: 'Élève introuvable.' }
  if (student.driving_school_id !== profile.driving_school_id) return { error: 'Accès refusé.' }
  if (student.training_status !== 'ready_for_exam') {
    return { error: "L'élève doit avoir le statut « Prêt pour l'examen »." }
  }

  // Fetch session to check capacity at the application layer before hitting DB
  const { data: session } = await supabase
    .from('exam_sessions')
    .select('id, available_slots, status')
    .eq('id', sessionId)
    .single()

  if (!session) return { error: "Session d'examen introuvable." }
  if (session.status !== 'open') return { error: "Cette session n'est plus ouverte aux réservations." }

  // Application-level capacity pre-check (non-authoritative — DB trigger is the lock)
  const { count: activeCount } = await supabase
    .from('exam_bookings')
    .select('*', { count: 'exact', head: true })
    .eq('exam_session_id', sessionId)
    .in('status', ['pending', 'approved'])

  if ((activeCount ?? 0) >= session.available_slots) {
    await logAuditEvent({
      actorProfileId: profile.id,
      actorUserId:    user.id,
      actorRole:      'school_admin',
      action:         'session.overbook_attempted',
      entityType:     'exam_session',
      entityId:       sessionId,
      metadata: {
        driving_school_id: profile.driving_school_id,
        student_id:        studentId,
        available_slots:   session.available_slots,
        active_bookings:   activeCount ?? 0,
      },
    })
    return { error: 'Cette session est complète. Aucune place disponible.' }
  }

  // Check no pending/approved booking already exists for this student/session
  const { data: existing } = await supabase
    .from('exam_bookings')
    .select('id, status')
    .eq('student_id', studentId)
    .eq('exam_session_id', sessionId)
    .maybeSingle()

  if (existing && existing.status !== 'rejected') {
    return { error: 'Une réservation existe déjà pour cet élève à cette session.' }
  }

  const { data: inserted, error: dbErr } = await supabase
    .from('exam_bookings')
    .insert({
      student_id:        studentId,
      driving_school_id: profile.driving_school_id,
      exam_session_id:   sessionId,
      status:            'pending',
    })
    .select('id')
    .single()

  if (dbErr) {
    // DB trigger fired — capacity exceeded by concurrent request
    if (dbErr.message?.includes('CAPACITY_EXCEEDED') || dbErr.message?.includes('capacity')) {
      await logAuditEvent({
        actorProfileId: profile.id,
        actorUserId:    user.id,
        actorRole:      'school_admin',
        action:         'session.overbook_attempted',
        entityType:     'exam_session',
        entityId:       sessionId,
        metadata: {
          driving_school_id: profile.driving_school_id,
          student_id:        studentId,
          db_error:          dbErr.message,
          source:            'db_trigger',
        },
      })
    }
    return { error: parseBookingError(dbErr.message) }
  }

  await logAuditEvent({
    actorProfileId: profile.id,
    actorUserId:    user.id,
    actorRole:      'school_admin',
    action:         'booking.requested',
    entityType:     'exam_booking',
    entityId:       inserted.id,
    metadata: {
      driving_school_id: profile.driving_school_id,
      student_id:        studentId,
      exam_session_id:   sessionId,
    },
  })

  revalidatePath('/dashboard/exams')
  return {}
}
