// TODO: rename 'super_admin' to 'government_admin' once the DB enum is migrated

import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAllAppointments } from '@/services/appointments'
import AdminAppointmentsClient from '@/components/appointments/AdminAppointmentsClient'

export default async function AppointmentsAdminPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (profile?.role !== 'super_admin') notFound()

  const appointments = await getAllAppointments()

  return <AdminAppointmentsClient appointments={appointments} />
}
