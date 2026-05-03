interface Props {
  current: number
  total: number
}

export default function ExamProgress({ current, total }: Props) {
  const pct = Math.round((current / total) * 100)

  return (
    <div className="mb-8">
      <div className="flex justify-between text-xs text-gray-500 mb-2">
        <span>Question {current} sur {total}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
