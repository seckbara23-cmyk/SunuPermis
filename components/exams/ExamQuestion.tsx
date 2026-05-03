import type { ExamQuestionForDisplay } from '@/types'

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E']

interface Props {
  question: ExamQuestionForDisplay
  selectedAnswer: string | null
  onSelect: (answer: string) => void
}

export default function ExamQuestion({ question, selectedAnswer, onSelect }: Props) {
  return (
    <div>
      <p className="text-base font-medium text-gray-900 leading-relaxed mb-6">
        {question.question_text}
      </p>

      <div className="space-y-3">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === option
          const label = OPTION_LABELS[index] ?? String(index + 1)

          return (
            <button
              key={index}
              onClick={() => onSelect(option)}
              className={`w-full text-left rounded-xl border-2 px-5 py-4 flex items-center gap-4 transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span
                className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  isSelected
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {label}
              </span>
              <span
                className={`text-sm ${isSelected ? 'text-blue-900 font-medium' : 'text-gray-700'}`}
              >
                {option}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
