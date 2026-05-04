import { createClient } from '@/lib/supabase/server'
import type { ExamSession } from '@/types'

export async function getExamSessions(): Promise<ExamSession[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('exam_sessions')
    .select('*')
    .order('exam_date', { ascending: true })
  return data ?? []
}

export async function getOpenExamSessions(): Promise<ExamSession[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('exam_sessions')
    .select('*')
    .eq('status', 'open')
    .gte('exam_date', new Date().toISOString())
    .order('exam_date', { ascending: true })
  return data ?? []
}
