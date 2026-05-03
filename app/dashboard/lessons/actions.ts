'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { LessonStatus } from '@/types'

export interface AddLessonInput {
  student_id: string
  instructor_id: string
  start_time: string
  end_time: string
  notes?: string
}

export async function addLesson(
  input: AddLessonInput
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, driving_school_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) return { error: 'Profil introuvable.' }

  const canAdd = profile.role === 'school_admin' || profile.role === 'super_admin'
  if (!canAdd) return { error: 'Accès refusé.' }

  // Validate end > start
  if (new Date(input.end_time) <= new Date(input.start_time)) {
    return { error: "L'heure de fin doit être après l'heure de début." }
  }

  // For school_admin, verify student belongs to their school
  if (profile.role === 'school_admin' && profile.driving_school_id) {
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('id', input.student_id)
      .eq('driving_school_id', profile.driving_school_id)
      .single()

    if (!student) {
      return { error: "Cet élève n'appartient pas à votre auto-école." }
    }
  }

  const { error } = await supabase.from('lessons').insert({
    student_id: input.student_id,
    instructor_id: input.instructor_id,
    start_time: input.start_time,
    end_time: input.end_time,
    notes: input.notes || null,
    status: 'scheduled',
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/lessons')
  return {}
}

export async function updateLessonStatus(
  lessonId: string,
  status: LessonStatus
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, driving_school_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) return { error: 'Profil introuvable.' }

  const canUpdate = profile.role === 'school_admin' || profile.role === 'super_admin'
  if (!canUpdate) return { error: 'Accès refusé.' }

  // For school_admin, verify the lesson's student belongs to their school
  if (profile.role === 'school_admin' && profile.driving_school_id) {
    const { data: lesson } = await supabase
      .from('lessons')
      .select('student_id')
      .eq('id', lessonId)
      .single()

    if (!lesson) return { error: 'Leçon introuvable.' }

    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('id', lesson.student_id)
      .eq('driving_school_id', profile.driving_school_id)
      .single()

    if (!student) return { error: 'Accès refusé.' }
  }

  const { data, error } = await supabase
    .from('lessons')
    .update({ status })
    .eq('id', lessonId)
    .select('id')
    .single()

  if (error || !data) {
    return { error: "Mise à jour impossible. Vérifiez vos droits d'accès." }
  }

  revalidatePath('/dashboard/lessons')
  revalidatePath(`/dashboard/lessons/${lessonId}`)
  return {}
}
