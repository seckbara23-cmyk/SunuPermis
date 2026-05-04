'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, error: 'Non authentifié.' }

  const { data: profile } = await supabase
    .from('profiles').select('id, role').eq('user_id', user.id).single()

  if (profile?.role !== 'super_admin') return { supabase, error: 'Accès refusé.' }
  return { supabase, profile, error: null }
}

export async function approveSchool(schoolId: string): Promise<{ error?: string }> {
  const { supabase, profile, error } = await requireAdmin()
  if (error || !profile) return { error: error ?? 'Erreur.' }

  const { error: dbErr } = await supabase.from('driving_schools').update({
    approval_status: 'approved',
    approved_at: new Date().toISOString(),
    approved_by: profile.id,
    rejection_reason: null,
    updated_at: new Date().toISOString(),
  }).eq('id', schoolId)

  if (dbErr) return { error: dbErr.message }
  revalidatePath('/admin/auto-ecoles')
  return {}
}

export async function rejectSchool(schoolId: string, reason: string): Promise<{ error?: string }> {
  if (!reason.trim()) return { error: 'La raison de rejet est obligatoire.' }
  const { supabase, error } = await requireAdmin()
  if (error) return { error }

  const { error: dbErr } = await supabase.from('driving_schools').update({
    approval_status: 'rejected',
    rejection_reason: reason.trim(),
    approved_at: null,
    approved_by: null,
    updated_at: new Date().toISOString(),
  }).eq('id', schoolId)

  if (dbErr) return { error: dbErr.message }
  revalidatePath('/admin/auto-ecoles')
  return {}
}

export async function toggleSchoolStatus(
  schoolId: string,
  currentStatus: 'active' | 'inactive'
): Promise<{ error?: string }> {
  const { supabase, error } = await requireAdmin()
  if (error) return { error }

  const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
  const { error: dbErr } = await supabase.from('driving_schools').update({
    status: newStatus,
    updated_at: new Date().toISOString(),
  }).eq('id', schoolId)

  if (dbErr) return { error: dbErr.message }
  revalidatePath('/admin/auto-ecoles')
  return {}
}
