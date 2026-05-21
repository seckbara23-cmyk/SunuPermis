import { createClient } from '@/lib/supabase/server'
import type { PaymentWithStudent } from '@/types'

const PAYMENT_SELECT = `
  id, student_id, driving_school_id, amount, payment_method,
  status, payment_date, notes, created_at,
  students(full_name)
` as const

export async function getPayments(schoolId: string | null): Promise<PaymentWithStudent[]> {
  const supabase = await createClient()

  let query = supabase
    .from('payments')
    .select(PAYMENT_SELECT)
    .order('created_at', { ascending: false })

  if (schoolId) {
    query = query.eq('driving_school_id', schoolId)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as PaymentWithStudent[]
}

export async function getPaymentsPaginated(
  schoolId: string | null,
  page: number,
  pageSize: number,
): Promise<{ payments: PaymentWithStudent[]; total: number }> {
  const supabase = await createClient()
  const offset = (page - 1) * pageSize

  let query = supabase
    .from('payments')
    .select(PAYMENT_SELECT, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (schoolId) {
    query = query.eq('driving_school_id', schoolId)
  }

  const { data, error, count } = await query
  if (error) throw new Error(error.message)
  return { payments: (data ?? []) as unknown as PaymentWithStudent[], total: count ?? 0 }
}
