'use server'

// TODO: rename 'super_admin' to 'government_admin' once the DB enum is migrated

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function getAdminProfile() {
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

export async function approveSchool(
  schoolId: string
): Promise<{ error?: string }> {
  const { supabase, profile, error: authError } = await getAdminProfile()
  if (authError || !profile) return { error: authError ?? 'Erreur inconnue.' }

  const { error } = await supabase
    .from('driving_schools')
    .update({
      approval_status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: profile.id,
      rejection_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', schoolId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/schools')
  return {}
}

export async function rejectSchool(
  schoolId: string,
  reason: string
): Promise<{ error?: string }> {
  if (!reason.trim()) return { error: 'La raison de rejet est obligatoire.' }

  const { supabase, profile, error: authError } = await getAdminProfile()
  if (authError || !profile) return { error: authError ?? 'Erreur inconnue.' }

  const { error } = await supabase
    .from('driving_schools')
    .update({
      approval_status: 'rejected',
      rejection_reason: reason.trim(),
      approved_at: null,
      approved_by: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', schoolId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/schools')
  return {}
}
