import type { ExamSubmitResult } from '@/types'

interface Props {
  result: ExamSubmitResult
  onRetry: () => void
}

export default function ExamResults({ result, onRetry }: Props) {
  const { score, correctCount, totalQuestions, passed } = result
  const missed = totalQuestions - correctCount

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        Résultat de l&apos;examen
      </h1>

      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
        {/* Score ring */}
        <div
          className={`w-36 h-36 rounded-full border-8 flex flex-col items-center justify-center mx-auto mb-6 ${
            passed
              ? 'border-green-400 bg-green-50'
              : 'border-red-400 bg-red-50'
          }`}
        >
          <span
            className={`text-4xl font-bold leading-none ${
              passed ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {score}%
          </span>
          <span className="text-xs text-gray-400 mt-1">Score</span>
        </div>

        {/* Pass / fail badge */}
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold ${
            passed
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {passed ? '✓ Réussi' : '✗ Échoué'}
        </span>

        {/* Detail */}
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

        {/* Message */}
        <p className="text-sm text-gray-500 mt-5">
          {passed
            ? 'Félicitations ! Vous avez atteint le score requis de 80%.'
            : `Il vous faut au moins 80% pour réussir. Vous êtes à ${80 - score}% du score requis.`}
        </p>

        {/* Actions */}
        <button
          onClick={onRetry}
          className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          Refaire un examen
        </button>
      </div>
    </div>
  )
}
