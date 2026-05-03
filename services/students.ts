import { createClient } from '@/lib/supabase/server'
import type { Student } from '@/types'

export async function getStudents(): Promise<Student[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getStudentById(id: string): Promise<Student | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function getDrivingSchools(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('driving_schools')
    .select('id, name')
    .eq('status', 'active')
    .order('name')

  if (error) throw new Error(error.message)
  return data ?? []
}
