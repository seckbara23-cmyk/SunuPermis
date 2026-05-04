'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ExamQuestionForDisplay, ExamSubmitResult } from '@/types'
import { submitExam } from '@/app/dashboard/exams/actions'
import ExamProgress from './ExamProgress'
import ExamQuestion from './ExamQuestion'

interface Props {
  questions: ExamQuestionForDisplay[]
  onComplete: (result: ExamSubmitResult) => void
}

export default function ExamSession({ questions, onComplete }: Props) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  // answers: questionId → selectedAnswer (can be changed until submission)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const current = questions[currentIndex]
  const isFirst = currentIndex === 0
  const isLast = currentIndex === questions.length - 1
  const currentAnswer = answers[current.id] ?? null
  const answeredCount = Object.keys(answers).length
  const allAnswered = answeredCount === questions.length

  function handleSelect(answer: string) {
    setAnswers((prev) => ({ ...prev, [current.id]: answer }))
  }

  function goNext() {
    if (!isLast) setCurrentIndex((i) => i + 1)
  }

  function goPrev() {
    if (!isFirst) setCurrentIndex((i) => i - 1)
  }

  // Auto-advance to next unanswered when selecting an answer (optional UX)
  function handleSelectAndAdvance(answer: string) {
    handleSelect(answer)
    if (!isLast && !answers[current.id]) {
      // Small delay so user sees the selection highlight before moving
      setTimeout(() => setCurrentIndex((i) => i + 1), 350)
    }
  }

  async function handleSubmit() {
    setError(null)
    setSubmitting(true)

    const payload = questions.map((q) => ({
      questionId: q.id,
      selectedAnswer: answers[q.id],
    }))

    const { result, error } = await submitExam(payload)

    if (error || !result) {
      setError(error ?? 'Erreur inconnue.')
      setSubmitting(false)
      return
    }

    // Refresh server data in the background so the history is up-to-date
    // by the time the user clicks "Refaire un examen"
    router.refresh()
    onComplete(result)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Examen blanc</h1>
        <span className="text-sm text-gray-400">
          {answeredCount}/{questions.length} réponse{answeredCount !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <ExamProgress current={currentIndex + 1} total={questions.length} />

        <ExamQuestion
          question={current}
          selectedAnswer={currentAnswer}
          onSelect={handleSelectAndAdvance}
        />

        {error && (
          <p className="mt-5 text-sm text-red-600 text-center">{error}</p>
        )}

        {/* Primary navigation */}
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
              className="px-5 py-2.5 rounded-lg bg-navy text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Suivant →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              className="px-5 py-2.5 rounded-lg bg-green-600 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Envoi en cours...' : 'Terminer l\'examen ✓'}
            </button>
          )}
        </div>

        {/* Question dot navigator */}
        <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-gray-100">
          {questions.map((q, i) => {
            const isActive = i === currentIndex
            const isAnswered = Boolean(answers[q.id])
            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(i)}
                title={`Question ${i + 1}`}
                className={`w-8 h-8 rounded-full text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-navy text-white ring-2 ring-blue-300'
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
