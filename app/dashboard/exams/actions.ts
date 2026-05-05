'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ExamQuestionForDisplay, ExamSubmitResult } from '@/types'

const EXAM_SIZE = 10
const PASS_THRESHOLD = 80

export async function fetchExamQuestions(): Promise<{
  questions?: ExamQuestionForDisplay[]
  error?: string
}> {
  // Verify the caller is authenticated before hitting the DB
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  // Use the admin client so this works regardless of which RLS policy exists
  // on exam_questions. correct_answer is never selected here.
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('exam_questions')
    .select('id, question_text, options, category, difficulty, created_at')

  if (error) return { error: error.message }
  if (!data || data.length === 0) return { error: 'Aucune question disponible.' }

  // Fisher-Yates shuffle, then take EXAM_SIZE
  const pool = [...data]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }

  return { questions: pool.slice(0, EXAM_SIZE) as ExamQuestionForDisplay[] }
}

export async function submitExam(
  answers: Array<{ questionId: string; selectedAnswer: string }>
): Promise<{ result?: ExamSubmitResult; error?: string }> {
  const supabase = await createClient()

  // 1. Verify auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  // 2. Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('user_id', user.id)
    .single()

  if (!profile) return { error: 'Profil introuvable.' }
  if (profile.role !== 'student') return { error: 'Seuls les élèves peuvent passer des examens.' }

  // 3. Get student record
  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('profile_id', profile.id)
    .single()

  if (!student) return { error: 'Dossier élève introuvable. Contactez votre auto-école.' }

  // 4. Re-fetch correct answers server-side using the admin client.
  //    Students have no RLS access to correct_answer on the raw table,
  //    so this MUST use the service-role client — never the user session.
  const admin = createAdminClient()
  const questionIds = answers.map((a) => a.questionId)
  const { data: questions, error: qErr } = await admin
    .from('exam_questions')
    .select('id, correct_answer')
    .in('id', questionIds)

  if (qErr || !questions) return { error: 'Erreur lors de la vérification des réponses.' }

  const correctAnswerMap = new Map(questions.map((q) => [q.id, q.correct_answer]))

  // 5. Grade answers
  const graded = answers.map((a) => ({
    questionId:      a.questionId,
    selectedAnswer:  a.selectedAnswer,
    isCorrect:       correctAnswerMap.get(a.questionId) === a.selectedAnswer,
  }))

  const correctCount   = graded.filter((a) => a.isCorrect).length
  const totalQuestions = answers.length
  const score          = Math.round((correctCount / totalQuestions) * 100)
  const passed         = score >= PASS_THRESHOLD

  // 6. Save mock_exam record (user session — student owns this row)
  const { data: exam, error: examErr } = await supabase
    .from('mock_exams')
    .insert({ student_id: student.id, score, total_questions: totalQuestions, passed })
    .select('id')
    .single()

  if (examErr || !exam) return { error: "Erreur lors de l'enregistrement de l'examen." }

  // 7. Save individual answers (non-fatal if this fails)
  const { error: answersErr } = await supabase.from('mock_exam_answers').insert(
    graded.map((a) => ({
      mock_exam_id:    exam.id,
      question_id:     a.questionId,
      selected_answer: a.selectedAnswer,
      is_correct:      a.isCorrect,
    }))
  )

  if (answersErr) {
    console.error('mock_exam_answers insert failed:', answersErr.message)
  }

  return {
    result: { examId: exam.id, score, totalQuestions, correctCount, passed },
  }
}
