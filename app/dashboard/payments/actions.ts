'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { PaymentMethod, PaymentStatus } from '@/types'

export interface AddPaymentInput {
  student_id: string
  amount: number
  payment_method: PaymentMethod
  status: PaymentStatus
  payment_date: string
  notes?: string
}

export async function addPayment(
  input: AddPaymentInput
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

  let schoolId: string

  if (profile.role === 'school_admin') {
    if (!profile.driving_school_id) return { error: 'Aucune auto-école liée à ce compte.' }
    schoolId = profile.driving_school_id
  } else {
    const { data: student } = await supabase
      .from('students')
      .select('driving_school_id')
      .eq('id', input.student_id)
      .single()
    if (!student) return { error: 'Élève introuvable.' }
    schoolId = student.driving_school_id
  }

  const { error } = await supabase.from('payments').insert({
    student_id: input.student_id,
    driving_school_id: schoolId,
    amount: input.amount,
    payment_method: input.payment_method,
    status: input.status,
    payment_date: input.payment_date,
    notes: input.notes?.trim() || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/payments')
  return {}
}
