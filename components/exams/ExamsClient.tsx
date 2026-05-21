'use client'

import { useState } from 'react'
import type { MockExam, InProgressExam, ExamSubmitResultV2 } from '@/types'
import ExamHub from './ExamHub'
import ExamSession from './ExamSession'
import ExamResults from './ExamResults'

type Phase = 'idle' | 'active' | 'finished'

interface Props {
  pastExams: MockExam[]
  inProgressExam: InProgressExam | null
}

export default function ExamsClient({ pastExams, inProgressExam }: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [activeExam, setActiveExam] = useState<InProgressExam | null>(null)
  const [result, setResult] = useState<ExamSubmitResultV2 | null>(null)

  function handleStart(exam: InProgressExam) {
    setActiveExam(exam)
    setPhase('active')
  }

  function handleComplete(res: ExamSubmitResultV2) {
    setResult(res)
    setPhase('finished')
  }

  function handleRetry() {
    setPhase('idle')
    setActiveExam(null)
    setResult(null)
  }

  if (phase === 'active' && activeExam) {
    return (
      <ExamSession
        questions={activeExam.questions}
        mode={activeExam.mode}
        categoryFilter={activeExam.categoryFilter}
        initialAnswers={activeExam.answers}
        initialIndex={activeExam.currentIndex}
        initialElapsed={activeExam.elapsedSeconds}
        onComplete={handleComplete}
      />
    )
  }

  if (phase === 'finished' && result) {
    return <ExamResults result={result} onRetry={handleRetry} />
  }

  return (
    <ExamHub
      pastExams={pastExams}
      inProgressExam={inProgressExam}
      onStart={handleStart}
    />
  )
}
