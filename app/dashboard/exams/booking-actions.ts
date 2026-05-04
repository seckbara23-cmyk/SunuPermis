'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function requestExamBooking(
  studentId: string,
  sessionId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, driving_school_id')
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

  // Check no pending/approved booking already exists for this session
  const { data: existing } = await supabase
    .from('exam_bookings')
    .select('id, status')
    .eq('student_id', studentId)
    .eq('exam_session_id', sessionId)
    .maybeSingle()

  if (existing && existing.status !== 'rejected') {
    return { error: 'Une réservation existe déjà pour cet élève à cette session.' }
  }

  const { error: dbErr } = await supabase.from('exam_bookings').insert({
    student_id:        studentId,
    driving_school_id: profile.driving_school_id,
    exam_session_id:   sessionId,
    status:            'pending',
  })

  if (dbErr) return { error: dbErr.message }

  revalidatePath('/dashboard/exams')
  return {}
}
