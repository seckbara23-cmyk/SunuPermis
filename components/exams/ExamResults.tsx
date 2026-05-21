import { useState } from 'react'
import type { ExamSubmitResultV2 } from '@/types'
import { CATEGORY_ICONS, PASS_THRESHOLD } from '@/lib/exam/categories'

interface Props {
  result: ExamSubmitResultV2
  onRetry: () => void
}

export default function ExamResults({ result, onRetry }: Props) {
  const { score, correctCount, totalQuestions, passed, mode, gradedAnswers, categoryStats } = result
  const missed = totalQuestions - correctCount
  const [showReview, setShowReview] = useState(false)

  const categories = Object.entries(categoryStats).sort(
    ([, a], [, b]) => a.correct / a.total - b.correct / b.total
  )

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        {mode === 'practice' ? 'Résultat de l\'entraînement' : 'Résultat de l\'examen'}
      </h1>

      {/* Score ring */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center mb-4">
        <div
          className={`w-36 h-36 rounded-full border-8 flex flex-col items-center justify-center mx-auto mb-6 ${
            passed ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'
          }`}
        >
          <span className={`text-4xl font-bold leading-none ${passed ? 'text-green-600' : 'text-red-600'}`}>
            {score}%
          </span>
          <span className="text-xs text-gray-400 mt-1">Score</span>
        </div>

        {mode !== 'practice' && (
          <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold ${
            passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {passed ? '✓ Réussi' : '✗ Échoué'}
          </span>
        )}

        <div className="mt-6 grid grid-cols-2 gap-4 text-center">
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-green-600">{correctCount}</p>
            <p className="text-xs text-gray-500 mt-1">Bonne{correctCount !== 1 ? 's' : ''} réponse{correctCount !== 1 ? 's' : ''}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-red-500">{missed}</p>
            <p className="text-xs text-gray-500 mt-1">Mauvaise{missed !== 1 ? 's' : ''} réponse{missed !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <p className="text-sm text-gray-500 mt-5">
          {mode === 'practice'
            ? `Entraînement terminé. Score : ${score}% (${correctCount}/${totalQuestions})`
            : passed
            ? 'Félicitations ! Vous avez atteint le score requis de 80%.'
            : `Il vous faut au moins ${PASS_THRESHOLD}% pour réussir. Vous êtes à ${PASS_THRESHOLD - score}% du score requis.`}
        </p>

        <button
          onClick={onRetry}
          className="mt-6 w-full rounded-lg bg-navy px-4 py-3 text-sm font-semibold text-white hover:bg-navy/90 transition-colors"
        >
          Refaire un examen
        </button>
      </div>

      {/* Category breakdown */}
      {categories.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Par catégorie</h2>
          <div className="space-y-3">
            {categories.map(([cat, stat]) => {
              const pct = Math.round((stat.correct / stat.total) * 100)
              return (
                <div key={cat}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">
                      {CATEGORY_ICONS[cat] ?? '📋'} {cat}
                    </span>
                    <span className={`font-semibold ${pct >= PASS_THRESHOLD ? 'text-green-600' : 'text-red-500'}`}>
                      {stat.correct}/{stat.total} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${pct >= PASS_THRESHOLD ? 'bg-green-500' : 'bg-red-400'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Per-question review */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <button
          onClick={() => setShowReview((v) => !v)}
          className="flex items-center justify-between w-full text-base font-semibold text-gray-900"
        >
          Révision des questions
          <span className="text-gray-400 text-sm font-normal">{showReview ? '▲ Masquer' : '▼ Afficher'}</span>
        </button>

        {showReview && (
          <div className="mt-5 space-y-6">
            {gradedAnswers.map((a, i) => (
              <div key={a.questionId} className={`rounded-xl p-4 border ${a.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <div className="flex items-start gap-3 mb-3">
                  <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${a.isCorrect ? 'bg-green-500' : 'bg-red-400'}`}>
                    {i + 1}
                  </span>
                  <p className="text-sm font-medium text-gray-900 leading-relaxed">{a.questionText}</p>
                </div>

                <div className="ml-9 space-y-1 text-xs">
                  {!a.isCorrect && (
                    <p className="text-red-700">
                      ✗ Votre réponse : <span className="font-medium">{a.selectedAnswer || '(sans réponse)'}</span>
                    </p>
                  )}
                  <p className="text-green-700">
                    ✓ Bonne réponse : <span className="font-medium">{a.correctAnswer}</span>
                  </p>
                  {a.explanation && (
                    <p className="text-gray-600 mt-1">{a.explanation}</p>
                  )}
                  {a.learningTip && (
                    <p className="text-gray-500 italic mt-1">💡 {a.learningTip}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
