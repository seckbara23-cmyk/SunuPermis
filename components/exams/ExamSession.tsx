'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type {
  ExamQuestionForDisplay,
  ExamMode,
  PracticeAnswerFeedback,
  ExamSubmitResultV2,
} from '@/types'
import { EXAM_DURATION_SECONDS } from '@/lib/exam/categories'
import { submitExamV2, checkAnswer, saveExamProgress } from '@/app/student/mock-exams/actions'
import ExamProgress from './ExamProgress'
import ExamQuestion from './ExamQuestion'
import ExamTimer from './ExamTimer'

interface Props {
  questions: ExamQuestionForDisplay[]
  mode: ExamMode
  categoryFilter: string | null
  initialAnswers?: Record<string, string>
  initialIndex?: number
  initialElapsed?: number
  onComplete: (result: ExamSubmitResultV2) => void
}

export default function ExamSession({
  questions,
  mode,
  categoryFilter,
  initialAnswers = {},
  initialIndex = 0,
  initialElapsed = 0,
  onComplete,
}: Props) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers)
  const [practiceFeedback, setPracticeFeedback] = useState<Record<string, PracticeAnswerFeedback>>({})
  const [checkingAnswer, setCheckingAnswer] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(initialElapsed)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const answersRef = useRef(answers)
  const elapsedRef = useRef(elapsedSeconds)
  answersRef.current = answers
  elapsedRef.current = elapsedSeconds

  const current = questions[currentIndex]
  const isFirst = currentIndex === 0
  const isLast = currentIndex === questions.length - 1
  const currentAnswer = answers[current.id] ?? null
  const currentFeedback = practiceFeedback[current.id] ?? null
  const answeredCount = Object.keys(answers).length
  const allAnswered = answeredCount === questions.length
  const isQuestionLocked = mode === 'practice' && Boolean(practiceFeedback[current.id])

  // ── Timer (exam mode only) ────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'exam') return
    const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [mode])

  const remainingSeconds = Math.max(0, EXAM_DURATION_SECONDS - elapsedSeconds)

  // ── Auto-submit when timer expires ────────────────────────────────────────
  const handleSubmit = useCallback(async (timedOut = false) => {
    setError(null)
    setSubmitting(true)

    const payload = questions.map((q) => ({
      questionId:     q.id,
      selectedAnswer: answersRef.current[q.id] ?? '',
    }))

    const { result, error } = await submitExamV2(payload, {
      mode,
      durationSeconds: mode === 'exam' ? elapsedRef.current : null,
      categoryFilter,
    })

    if (error || !result) {
      setError(error ?? 'Erreur inconnue.')
      setSubmitting(false)
      return
    }

    router.refresh()
    onComplete(result)
  }, [questions, mode, categoryFilter, router, onComplete])

  useEffect(() => {
    if (mode === 'exam' && remainingSeconds === 0 && !submitting) {
      handleSubmit(true)
    }
  }, [mode, remainingSeconds, submitting, handleSubmit])

  // ── Autosave every 30s (exam mode) ────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'exam') return
    const id = setInterval(() => {
      saveExamProgress({
        answers:        answersRef.current,
        currentIndex,
        elapsedSeconds: elapsedRef.current,
      })
    }, 30_000)
    return () => clearInterval(id)
  }, [mode, currentIndex])

  // ── Warn before leaving ───────────────────────────────────────────────────
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // ── Answer handling ───────────────────────────────────────────────────────
  async function handleSelect(answer: string) {
    if (isQuestionLocked) return
    setAnswers((prev) => ({ ...prev, [current.id]: answer }))

    if (mode === 'practice') {
      setCheckingAnswer(true)
      const { feedback } = await checkAnswer(current.id, answer)
      setCheckingAnswer(false)
      if (feedback) {
        setPracticeFeedback((prev) => ({ ...prev, [current.id]: feedback }))
      }
      return
    }

    // Exam mode: auto-advance to next unanswered
    if (!isLast && !answers[current.id]) {
      setTimeout(() => setCurrentIndex((i) => i + 1), 350)
    }
  }

  function goNext() { if (!isLast) setCurrentIndex((i) => i + 1) }
  function goPrev() { if (!isFirst) setCurrentIndex((i) => i - 1) }

  const modeLabelShort = mode === 'practice' ? 'Entraînement' : 'Examen blanc'

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{modeLabelShort}</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">
            {answeredCount}/{questions.length}
          </span>
          {mode === 'exam' && (
            <ExamTimer remainingSeconds={remainingSeconds} />
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
        <ExamProgress current={currentIndex + 1} total={questions.length} />

        {checkingAnswer && (
          <p className="text-xs text-center text-gray-400 mb-2">Vérification...</p>
        )}

        <ExamQuestion
          question={current}
          selectedAnswer={currentAnswer}
          onSelect={handleSelect}
          feedback={currentFeedback}
          locked={isQuestionLocked || submitting}
        />

        {error && (
          <p className="mt-5 text-sm text-red-600 text-center">{error}</p>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={goPrev}
            disabled={isFirst}
            className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← Précédent
          </button>

          {!isLast ? (
            <button
              onClick={goNext}
              className="px-5 py-2.5 rounded-lg bg-navy text-sm font-semibold text-white hover:bg-navy/90 transition-colors"
            >
              Suivant →
            </button>
          ) : (
            <button
              onClick={() => handleSubmit()}
              disabled={!allAnswered || submitting || checkingAnswer}
              className="px-5 py-2.5 rounded-lg bg-green-600 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Envoi...' : 'Terminer ✓'}
            </button>
          )}
        </div>

        {/* Dot navigator */}
        <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-gray-100">
          {questions.map((q, i) => {
            const isActive   = i === currentIndex
            const isAnswered = Boolean(answers[q.id])
            const hasFeedback = Boolean(practiceFeedback[q.id])
            const isCorrect  = hasFeedback && practiceFeedback[q.id]?.isCorrect
            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(i)}
                title={`Question ${i + 1}`}
                className={`w-8 h-8 rounded-full text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-navy text-white ring-2 ring-blue-300'
                    : hasFeedback
                    ? isCorrect
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-red-100 text-red-600 hover:bg-red-200'
                    : isAnswered
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
              >
                {i + 1}
              </button>
            )
          })}
        </div>

        {!allAnswered && isLast && (
          <p className="mt-3 text-xs text-center text-amber-600">
            Répondez à toutes les questions avant de soumettre.
          </p>
        )}
      </div>
    </div>
  )
}
