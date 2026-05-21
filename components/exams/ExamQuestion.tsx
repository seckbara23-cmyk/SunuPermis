import type { ExamQuestionForDisplay, PracticeAnswerFeedback } from '@/types'

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E']

interface Props {
  question: ExamQuestionForDisplay
  selectedAnswer: string | null
  onSelect: (answer: string) => void
  feedback?: PracticeAnswerFeedback | null
  locked?: boolean
}

export default function ExamQuestion({ question, selectedAnswer, onSelect, feedback, locked }: Props) {
  return (
    <div>
      <p className="text-base font-medium text-gray-900 leading-relaxed mb-6">
        {question.question_text}
      </p>

      <div className="space-y-3">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === option
          const label = OPTION_LABELS[index] ?? String(index + 1)

          let borderClass = 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
          let circleClass = 'bg-gray-100 text-gray-500'
          let textClass   = 'text-gray-700'

          if (feedback) {
            if (option === feedback.correctAnswer) {
              borderClass = 'border-green-500 bg-green-50'
              circleClass = 'bg-green-500 text-white'
              textClass   = 'text-green-900 font-medium'
            } else if (isSelected && !feedback.isCorrect) {
              borderClass = 'border-red-400 bg-red-50'
              circleClass = 'bg-red-400 text-white'
              textClass   = 'text-red-900'
            } else {
              borderClass = 'border-gray-100 bg-gray-50 opacity-60'
            }
          } else if (isSelected) {
            borderClass = 'border-blue-500 bg-blue-50'
            circleClass = 'bg-blue-500 text-white'
            textClass   = 'text-blue-900 font-medium'
          }

          return (
            <button
              key={index}
              onClick={() => !locked && onSelect(option)}
              disabled={locked}
              className={`w-full text-left rounded-xl border-2 px-5 py-4 flex items-center gap-4 transition-all ${borderClass} ${
                locked ? 'cursor-default' : 'cursor-pointer'
              }`}
            >
              <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${circleClass}`}>
                {label}
              </span>
              <span className={`text-sm ${textClass}`}>{option}</span>
            </button>
          )
        })}
      </div>

      {/* Practice mode: show feedback after answering */}
      {feedback && (
        <div className={`mt-5 rounded-xl p-4 ${feedback.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
          <p className={`text-sm font-semibold mb-1 ${feedback.isCorrect ? 'text-green-700' : 'text-amber-700'}`}>
            {feedback.isCorrect ? '✓ Bonne réponse !' : `✗ Réponse correcte : ${feedback.correctAnswer}`}
          </p>
          {feedback.explanation && (
            <p className="text-sm text-gray-700 mt-1">{feedback.explanation}</p>
          )}
          {feedback.learningTip && (
            <p className="text-xs text-gray-500 mt-2 italic">💡 {feedback.learningTip}</p>
          )}
        </div>
      )}
    </div>
  )
}
