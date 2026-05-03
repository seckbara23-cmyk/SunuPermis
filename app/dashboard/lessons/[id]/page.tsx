import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getLessonById } from '@/services/lessons'
import LessonDetail from '@/components/lessons/LessonDetail'
import type { UserRole } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function LessonDetailPage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [lesson, { data: profile }] = await Promise.all([
    getLessonById(id),
    supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single(),
  ])

  if (!lesson) notFound()

  const role = (profile?.role ?? 'instructor') as UserRole
  const canUpdate = role === 'school_admin' || role === 'super_admin'

  return <LessonDetail lesson={lesson} canUpdate={canUpdate} />
}
