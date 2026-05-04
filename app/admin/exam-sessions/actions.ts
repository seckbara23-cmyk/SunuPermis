'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, userId: null as string | null, error: 'Non authentifié.' }

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('user_id', user.id).single()

  if (profile?.role !== 'super_admin') return { supabase, userId: null, error: 'Accès refusé.' }
  return { supabase, userId: user.id, error: null }
}

export interface CreateSessionInput {
  exam_date: string
  exam_center: string
  available_slots: number
}

export async function createExamSession(
  input: CreateSessionInput
): Promise<{ error?: string }> {
  const { supabase, userId, error } = await requireAdmin()
  if (error || !userId) return { error: error ?? 'Erreur.' }

  if (!input.exam_date || !input.exam_center.trim()) {
    return { error: 'Date et centre sont obligatoires.' }
  }
  if (input.available_slots < 1) return { error: 'Le nombre de places doit être ≥ 1.' }

  const { error: dbErr } = await supabase.from('exam_sessions').insert({
    exam_date:       input.exam_date,
    exam_center:     input.exam_center.trim(),
    available_slots: input.available_slots,
    status:          'open',
    created_by:      userId,
  })

  if (dbErr) return { error: dbErr.message }
  revalidatePath('/admin/exam-sessions')
  return {}
}

export async function toggleSessionStatus(
  sessionId: string,
  currentStatus: 'open' | 'closed'
): Promise<{ error?: string }> {
  const { supabase, error } = await requireAdmin()
  if (error) return { error }

  const { error: dbErr } = await supabase
    .from('exam_sessions')
    .update({ status: currentStatus === 'open' ? 'closed' : 'open' })
    .eq('id', sessionId)

  if (dbErr) return { error: dbErr.message }
  revalidatePath('/admin/exam-sessions')
  return {}
}
