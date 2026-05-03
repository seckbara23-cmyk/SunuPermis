import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPayments } from '@/services/payments'
import { getStudents } from '@/services/students'
import PaymentsClient from '@/components/payments/PaymentsClient'
import type { UserRole } from '@/types'

export default async function PaymentsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, driving_school_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/login')

  const role = profile.role as UserRole
  const canAdd = role === 'school_admin' || role === 'super_admin'

  const schoolId = role === 'school_admin' ? profile.driving_school_id : null

  const [payments, students] = await Promise.all([
    getPayments(schoolId),
    canAdd ? getStudents() : Promise.resolve([]),
  ])

  return (
    <PaymentsClient
      payments={payments}
      students={students.map((s) => ({ id: s.id, full_name: s.full_name }))}
      canAdd={canAdd}
    />
  )
}
