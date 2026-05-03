import { createClient } from '@/lib/supabase/server'
import type { Instructor } from '@/types'

export async function getInstructors(): Promise<Instructor[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('instructors')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getInstructorById(id: string): Promise<Instructor | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('instructors')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function getDrivingSchoolsForInstructors(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('driving_schools')
    .select('id, name')
    .eq('status', 'active')
    .order('name')

  if (error) throw new Error(error.message)
  return data ?? []
}
