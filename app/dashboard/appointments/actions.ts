'use server'

// TODO: rename 'super_admin' to 'government_admin' once the DB enum is migrated

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function revalidateBoth() {
  revalidatePath('/dashboard/appointments')
  revalidatePath('/dashboard/appointments-admin')
}

// ── School admin ──────────────────────────────────────────────────

export async function requestAppointment(
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

  // Verify student belongs to this school and is ready_for_exam
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

  // Ensure no active appointment already exists for this student
  const { data: existing } = await supabase
    .from('appointments')
    .select('id, status')
    .eq('student_id', studentId)
    .in('status', ['pending', 'confirmed'])
    .maybeSingle()

  if (existing) {
    return { error: "Cet élève a déjà un rendez-vous en attente ou confirmé." }
  }

  const { error } = await supabase.from('appointments').insert({
    student_id: studentId,
    driving_school_id: profile.driving_school_id,
    requested_by: profile.id,
    status: 'pending',
  })

  if (error) return { error: error.message }

  revalidateBoth()
  return {}
}

// ── Government admin ──────────────────────────────────────────────

async function requireSuperAdmin() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, profile: null, error: 'Non authentifié.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('user_id', user.id)
    .single()

  if (!profile || profile.role !== 'super_admin') {
    return { supabase, profile: null, error: 'Accès refusé.' }
  }

  return { supabase, profile, error: null }
}

export async function confirmAppointment(
  appointmentId: string,
  scheduledAt: string
): Promise<{ error?: string }> {
  if (!scheduledAt) return { error: 'La date du rendez-vous est obligatoire.' }

  const { supabase, profile, error: authError } = await requireSuperAdmin()
  if (authError || !profile) return { error: authError ?? 'Erreur inconnue.' }

  const { error } = await supabase
    .from('appointments')
    .update({
      status: 'confirmed',
      scheduled_at: scheduledAt,
      confirmed_by: profile.id,
      confirmed_at: new Date().toISOString(),
      rejection_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', appointmentId)

  if (error) return { error: error.message }

  revalidateBoth()
  return {}
}

export async function rejectAppointment(
  appointmentId: string,
  reason: string
): Promise<{ error?: string }> {
  if (!reason.trim()) return { error: 'La raison du rejet est obligatoire.' }

  const { supabase, profile, error: authError } = await requireSuperAdmin()
  if (authError || !profile) return { error: authError ?? 'Erreur inconnue.' }

  const { error } = await supabase
    .from('appointments')
    .update({
      status: 'rejected',
      rejection_reason: reason.trim(),
      scheduled_at: null,
      confirmed_by: null,
      confirmed_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', appointmentId)

  if (error) return { error: error.message }

  revalidateBoth()
  return {}
}

export async function cancelAppointment(
  appointmentId: string
): Promise<{ error?: string }> {
  const { supabase, profile, error: authError } = await requireSuperAdmin()
  if (authError || !profile) return { error: authError ?? 'Erreur inconnue.' }

  const { error } = await supabase
    .from('appointments')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', appointmentId)

  if (error) return { error: error.message }

  revalidateBoth()
  return {}
}
