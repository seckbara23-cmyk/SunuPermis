import { createClient } from '@/lib/supabase/server'
import type { MockExam } from '@/types'

export async function getPastExams(studentId: string): Promise<MockExam[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('mock_exams')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getStudentByProfileId(
  profileId: string
): Promise<{ id: string } | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('students')
    .select('id')
    .eq('profile_id', profileId)
    .single()

  return data ?? null
}
