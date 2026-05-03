// TODO: rename 'super_admin' to 'government_admin' once the DB enum is migrated

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSchools } from '@/services/schools'
import SchoolsClient from '@/components/schools/SchoolsClient'

export default async function SchoolsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (profile?.role !== 'super_admin') redirect('/dashboard')

  const schools = await getSchools()

  return <SchoolsClient schools={schools} />
}
