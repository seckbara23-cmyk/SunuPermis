'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { InstructorStatus } from '@/types'

export interface AddInstructorInput {
  full_name: string
  phone: string
  email: string
  status: InstructorStatus
  driving_school_id?: string // required for super_admin, unused for school_admin
}

export async function addInstructor(
  input: AddInstructorInput
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

  let schoolId: string

  if (profile.role === 'school_admin') {
    if (!profile.driving_school_id) {
      return { error: 'Aucune auto-école liée à ce compte.' }
    }
    schoolId = profile.driving_school_id
  } else if (profile.role === 'super_admin') {
    if (!input.driving_school_id) {
      return { error: 'Veuillez sélectionner une auto-école.' }
    }
    schoolId = input.driving_school_id
  } else {
    return { error: 'Accès refusé.' }
  }

  const { error } = await supabase.from('instructors').insert({
    full_name: input.full_name,
    phone: input.phone || null,
    email: input.email || null,
    status: input.status,
    driving_school_id: schoolId,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/instructors')
  return {}
}

export async function updateInstructorStatus(
  instructorId: string,
  status: InstructorStatus
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!profile) return { error: 'Profil introuvable.' }

  const canUpdate = profile.role === 'school_admin' || profile.role === 'super_admin'
  if (!canUpdate) return { error: 'Accès refusé.' }

  const { data, error } = await supabase
    .from('instructors')
    .update({ status })
    .eq('id', instructorId)
    .select('id')
    .single()

  if (error || !data) {
    return { error: "Mise à jour impossible. Vérifiez vos droits d'accès." }
  }

  revalidatePath('/dashboard/instructors')
  return {}
}
