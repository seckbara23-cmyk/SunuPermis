import { createClient } from '@/lib/supabase/server'
import type { LessonWithNames } from '@/types'

export async function getLessons(drivingSchoolId: string | null): Promise<LessonWithNames[]> {
  const supabase = await createClient()

  // For school_admin, scope to lessons whose student belongs to their school
  let studentIdFilter: string[] | null = null
  if (drivingSchoolId) {
    const { data: schoolStudents } = await supabase
      .from('students')
      .select('id')
      .eq('driving_school_id', drivingSchoolId)
    studentIdFilter = (schoolStudents ?? []).map((s) => s.id)
    if (studentIdFilter.length === 0) return []
  }

  let query = supabase
    .from('lessons')
    .select(`
      id, student_id, instructor_id, lesson_type, start_time, end_time, status, notes, created_at,
      students(full_name),
      instructors(full_name)
    `)
    .order('start_time', { ascending: false })

  if (studentIdFilter) {
    query = query.in('student_id', studentIdFilter)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as LessonWithNames[]
}

export async function getLessonById(id: string): Promise<LessonWithNames | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('lessons')
    .select(`
      id, student_id, instructor_id, lesson_type, start_time, end_time, status, notes, created_at,
      students(full_name),
      instructors(full_name)
    `)
    .eq('id', id)
    .single()

  if (error) return null
  return data as unknown as LessonWithNames
}

export async function getStudentsForLesson(
  drivingSchoolId: string | null
): Promise<{ id: string; full_name: string }[]> {
  const supabase = await createClient()

  let query = supabase
    .from('students')
    .select('id, full_name')
    .order('full_name')

  if (drivingSchoolId) {
    query = query.eq('driving_school_id', drivingSchoolId)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getActiveInstructorsForLesson(
  drivingSchoolId: string | null
): Promise<{ id: string; full_name: string }[]> {
  const supabase = await createClient()

  let query = supabase
    .from('instructors')
    .select('id, full_name')
    .eq('status', 'active')
    .order('full_name')

  if (drivingSchoolId) {
    query = query.eq('driving_school_id', drivingSchoolId)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}
