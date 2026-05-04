'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, error: 'Non authentifié.' }

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('user_id', user.id).single()

  if (profile?.role !== 'super_admin') return { supabase, error: 'Accès refusé.' }
  return { supabase, error: null }
}

export async function recordResult(
  bookingId: string,
  result: 'passed' | 'failed'
): Promise<{ error?: string }> {
  const { supabase, error } = await requireAdmin()
  if (error) return { error }

  const { error: dbErr } = await supabase
    .from('exam_bookings')
    .update({ result, updated_at: new Date().toISOString() })
    .eq('id', bookingId)
    .eq('status', 'approved')

  if (dbErr) return { error: dbErr.message }

  revalidatePath('/admin/results')
  revalidatePath('/admin/exam-bookings')
  return {}
}
