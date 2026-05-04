import { createClient } from '@/lib/supabase/server'
import type { DrivingSchool } from '@/types'
import AutoEcolesClient from './AutoEcolesClient'

export default async function AutoEcolesPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('driving_schools')
    .select('*')
    .order('created_at', { ascending: false })
  return <AutoEcolesClient initialSchools={(data ?? []) as DrivingSchool[]} />
}
