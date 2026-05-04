import { createClient } from '@/lib/supabase/server'
import type { ExamSession } from '@/types'
import ExamSessionsClient from './ExamSessionsClient'

export default async function ExamSessionsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('exam_sessions')
    .select('*')
    .order('exam_date', { ascending: true })
  return <ExamSessionsClient initialSessions={(data ?? []) as ExamSession[]} />
}
