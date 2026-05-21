import { EXAM_DURATION_SECONDS } from '@/lib/exam/categories'

interface Props {
  remainingSeconds: number
}

export default function ExamTimer({ remainingSeconds }: Props) {
  const isUrgent = remainingSeconds <= 5 * 60
  const pct = Math.max(0, remainingSeconds / EXAM_DURATION_SECONDS)
  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-mono font-semibold transition-colors ${
        isUrgent ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-gray-100 text-gray-700'
      }`}
      role="timer"
      aria-label={`Temps restant : ${display}`}
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none" strokeWidth={2} stroke="currentColor">
        <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
        <path
          d={`M12 2 A10 10 0 ${pct > 0.5 ? 1 : 0} 1 ${
            12 + 10 * Math.sin(2 * Math.PI * (1 - pct))
          } ${12 - 10 * Math.cos(2 * Math.PI * (1 - pct))}`}
          strokeLinecap="round"
        />
      </svg>
      {display}
    </div>
  )
}
