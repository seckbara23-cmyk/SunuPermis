'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { EXAM_SIZE, PASS_THRESHOLD } from '@/lib/exam/categories'
import type {
  ExamQuestionForDisplay,
  ExamMode,
  InProgressExam,
  PracticeAnswerFeedback,
  ExamSubmitResultV2,
  GradedAnswer,
} from '@/types'

// ── Auth helpers ──────────────────────────────────────────────────────────────

async function getStudentId(): Promise<{ studentId: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('user_id', user.id)
    .single()

  if (!profile) return { error: 'Profil introuvable.' }
  if (profile.role !== 'student') return { error: 'Seuls les élèves peuvent passer des examens.' }

  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('profile_id', profile.id)
    .single()

  if (!student) return { error: 'Dossier élève introuvable. Contactez votre auto-école.' }
  return { studentId: student.id }
}

// ── startExam ─────────────────────────────────────────────────────────────────

export async function startExam({
  mode,
  categoryFilter,
}: {
  mode: ExamMode
  categoryFilter: string | null
}): Promise<{ exam?: InProgressExam; error?: string }> {
  const auth = await getStudentId()
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()

  let questionQuery = admin
    .from('exam_questions')
    .select('id, question_text, options, category, difficulty, learning_tip, created_at')
    .eq('is_active', true)

  if (categoryFilter) {
    questionQuery = questionQuery.eq('category', categoryFilter)
  }

  const { data, error } = await questionQuery

  if (error) return { error: error.message }
  if (!data || data.length === 0) return { error: 'Aucune question disponible pour cette catégorie.' }

  // Fisher-Yates shuffle, then take EXAM_SIZE
  const pool = [...data]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  const selected = pool.slice(0, EXAM_SIZE) as ExamQuestionForDisplay[]

  // Upsert in-progress record (one per student)
  const { error: upsertErr } = await admin
    .from('exam_in_progress')
    .upsert(
      {
        student_id:      auth.studentId,
        question_ids:    selected.map((q) => q.id),
        answers:         {},
        current_index:   0,
        mode,
        category_filter: categoryFilter,
        elapsed_seconds: 0,
      },
      { onConflict: 'student_id' }
    )

  if (upsertErr) return { error: upsertErr.message }

  return {
    exam: {
      questions:      selected,
      answers:        {},
      currentIndex:   0,
      elapsedSeconds: 0,
      mode,
      categoryFilter,
    },
  }
}

// ── checkAnswer ───────────────────────────────────────────────────────────────

export async function checkAnswer(
  questionId: string,
  selectedAnswer: string
): Promise<{ feedback?: PracticeAnswerFeedback; error?: string }> {
  const auth = await getStudentId()
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('exam_questions')
    .select('correct_answer, explanation, learning_tip')
    .eq('id', questionId)
    .single()

  if (error || !data) return { error: 'Question introuvable.' }

  return {
    feedback: {
      isCorrect:     data.correct_answer === selectedAnswer,
      correctAnswer: data.correct_answer,
      explanation:   data.explanation ?? null,
      learningTip:   data.learning_tip ?? null,
    },
  }
}

// ── saveExamProgress ──────────────────────────────────────────────────────────

export async function saveExamProgress({
  answers,
  currentIndex,
  elapsedSeconds,
}: {
  answers: Record<string, string>
  currentIndex: number
  elapsedSeconds: number
}): Promise<{ error?: string }> {
  const auth = await getStudentId()
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin
    .from('exam_in_progress')
    .update({ answers, current_index: currentIndex, elapsed_seconds: elapsedSeconds })
    .eq('student_id', auth.studentId)

  if (error) return { error: error.message }
  return {}
}

// ── getInProgressExam ─────────────────────────────────────────────────────────

export async function getInProgressExam(): Promise<InProgressExam | null> {
  const auth = await getStudentId()
  if ('error' in auth) return null

  const admin = createAdminClient()
  const { data: row } = await admin
    .from('exam_in_progress')
    .select('question_ids, answers, current_index, elapsed_seconds, mode, category_filter')
    .eq('student_id', auth.studentId)
    .maybeSingle()

  if (!row || !row.question_ids?.length) return null

  // Re-fetch question details in the original order
  const { data: questions } = await admin
    .from('exam_questions')
    .select('id, question_text, options, category, difficulty, learning_tip, created_at')
    .in('id', row.question_ids)

  if (!questions || questions.length === 0) return null

  // Preserve original question order
  const idToQuestion = new Map(questions.map((q) => [q.id, q]))
  const ordered = row.question_ids
    .map((id: string) => idToQuestion.get(id))
    .filter(Boolean) as ExamQuestionForDisplay[]

  return {
    questions:      ordered,
    answers:        (row.answers as Record<string, string>) ?? {},
    currentIndex:   row.current_index ?? 0,
    elapsedSeconds: row.elapsed_seconds ?? 0,
    mode:           (row.mode as ExamMode) ?? 'exam',
    categoryFilter: row.category_filter ?? null,
  }
}

// ── clearExamProgress ─────────────────────────────────────────────────────────

export async function clearExamProgress(): Promise<{ error?: string }> {
  const auth = await getStudentId()
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const { error } = await admin
    .from('exam_in_progress')
    .delete()
    .eq('student_id', auth.studentId)

  if (error) return { error: error.message }
  return {}
}

// ── submitExamV2 ──────────────────────────────────────────────────────────────

export async function submitExamV2(
  answers: Array<{ questionId: string; selectedAnswer: string }>,
  {
    mode,
    durationSeconds,
    categoryFilter,
  }: {
    mode: ExamMode
    durationSeconds: number | null
    categoryFilter: string | null
  }
): Promise<{ result?: ExamSubmitResultV2; error?: string }> {
  const supabase = await createClient()
  const auth = await getStudentId()
  if ('error' in auth) return { error: auth.error }

  const admin = createAdminClient()
  const questionIds = answers.map((a) => a.questionId)

  // Re-fetch correct answers + metadata server-side — never sent to client during exam
  const { data: questions, error: qErr } = await admin
    .from('exam_questions')
    .select('id, correct_answer, explanation, learning_tip, category, question_text, options')
    .in('id', questionIds)

  if (qErr || !questions) return { error: 'Erreur lors de la vérification des réponses.' }

  const qMap = new Map(questions.map((q) => [q.id, q]))

  // Grade
  const gradedAnswers: GradedAnswer[] = answers.map((a) => {
    const q = qMap.get(a.questionId)
    return {
      questionId:     a.questionId,
      selectedAnswer: a.selectedAnswer,
      isCorrect:      q ? q.correct_answer === a.selectedAnswer : false,
      correctAnswer:  q?.correct_answer ?? '',
      explanation:    q?.explanation ?? null,
      learningTip:    q?.learning_tip ?? null,
      category:       q?.category ?? '',
      questionText:   q?.question_text ?? '',
      options:        (q?.options ?? []) as string[],
    }
  })

  const correctCount   = gradedAnswers.filter((a) => a.isCorrect).length
  const totalQuestions = answers.length
  const score          = Math.round((correctCount / totalQuestions) * 100)
  const passed         = score >= PASS_THRESHOLD

  // Category stats
  const categoryStats: Record<string, { correct: number; total: number }> = {}
  for (const a of gradedAnswers) {
    if (!categoryStats[a.category]) categoryStats[a.category] = { correct: 0, total: 0 }
    categoryStats[a.category].total++
    if (a.isCorrect) categoryStats[a.category].correct++
  }

  // Save mock_exam record (user session — student owns this row via RLS)
  const { data: exam, error: examErr } = await supabase
    .from('mock_exams')
    .insert({
      student_id:      auth.studentId,
      score,
      total_questions: totalQuestions,
      passed,
      mode,
      duration_seconds: durationSeconds,
      category_filter:  categoryFilter,
    })
    .select('id')
    .single()

  if (examErr || !exam) return { error: "Erreur lors de l'enregistrement de l'examen." }

  // Save individual answers (non-fatal)
  const { error: answersErr } = await supabase.from('mock_exam_answers').insert(
    gradedAnswers.map((a) => ({
      mock_exam_id:    exam.id,
      question_id:     a.questionId,
      selected_answer: a.selectedAnswer,
      is_correct:      a.isCorrect,
    }))
  )

  if (answersErr) {
    console.error('mock_exam_answers insert failed:', answersErr.message)
  }

  // Clear in-progress record
  await admin.from('exam_in_progress').delete().eq('student_id', auth.studentId)

  return {
    result: {
      examId:          exam.id,
      score,
      totalQuestions,
      correctCount,
      passed,
      mode,
      durationSeconds,
      gradedAnswers,
      categoryStats,
    },
  }
}
