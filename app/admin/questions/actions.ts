'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { EXAM_CATEGORIES } from '@/lib/exam/categories'

async function requireSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('user_id', user.id).single()

  if (profile?.role !== 'super_admin') redirect('/login')
}

export async function toggleQuestionActive(
  questionId: string,
  currentIsActive: boolean
): Promise<void> {
  await requireSuperAdmin()

  const admin = createAdminClient()
  await admin
    .from('exam_questions')
    .update({ is_active: !currentIsActive })
    .eq('id', questionId)

  revalidatePath('/admin/questions')
}

export async function createQuestion(formData: FormData): Promise<void> {
  await requireSuperAdmin()

  const question_text = (formData.get('question_text') as string | null)?.trim()
  const correct_answer = (formData.get('correct_answer') as string | null)?.trim()
  const category = formData.get('category') as string | null
  const difficulty = formData.get('difficulty') as string | null
  const explanation = (formData.get('explanation') as string | null)?.trim() || null
  const learning_tip = (formData.get('learning_tip') as string | null)?.trim() || null

  const rawOptions = formData.getAll('options') as string[]
  const options = rawOptions.map((o) => o.trim()).filter(Boolean)

  if (!question_text || options.length < 2 || !correct_answer || !category || !difficulty) {
    redirect('/admin/questions?new=1&error=validation')
  }

  const admin = createAdminClient()
  const { error } = await admin.from('exam_questions').insert({
    question_text,
    options,
    correct_answer,
    category,
    difficulty,
    explanation,
    learning_tip,
    is_active: true,
    tags: [],
  })

  if (error) redirect('/admin/questions?new=1&error=db')
  redirect('/admin/questions?created=1')
}
