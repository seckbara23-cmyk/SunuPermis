import { createClient } from '@/lib/supabase/server'
import type { DrivingSchool } from '@/types'

export async function getSchools(): Promise<DrivingSchool[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('driving_schools')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}
