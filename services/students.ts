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

// accountStatusFilter values:
//   undefined / 'active'   → active students only (default)
//   'suspended'            → suspended students only
//   'archived'             → archived students only
//   'all'                  → all students regardless of status
export async function getStudentsPaginated(
  page: number,
  pageSize: number,
  accountStatusFilter?: string,
): Promise<{ students: Student[]; total: number }> {
  const supabase = await createClient()
  const offset = (page - 1) * pageSize

  let query = supabase
    .from('students')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (!accountStatusFilter || accountStatusFilter === 'active') {
    query = query.eq('account_status', 'active')
  } else if (accountStatusFilter === 'suspended') {
    query = query.eq('account_status', 'suspended')
  } else if (accountStatusFilter === 'archived') {
    query = query.eq('account_status', 'archived')
  }
  // 'all': no additional filter — show everyone

  const { data, error, count } = await query
  if (error) throw new Error(error.message)
  return { students: data ?? [], total: count ?? 0 }
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
