'use client'

import { useState } from 'react'
import type { MockExam, ExamQuestionForDisplay, ExamSubmitResult } from '@/types'
import ExamHub from './ExamHub'
import ExamSession from './ExamSession'
import ExamResults from './ExamResults'

type Phase = 'idle' | 'active' | 'finished'

interface Props {
  pastExams: MockExam[]
}

export default function ExamsClient({ pastExams }: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [questions, setQuestions] = useState<ExamQuestionForDisplay[]>([])
  const [result, setResult] = useState<ExamSubmitResult | null>(null)

  function handleStart(qs: ExamQuestionForDisplay[]) {
    setQuestions(qs)
    setPhase('active')
  }

  function handleComplete(res: ExamSubmitResult) {
    setResult(res)
    setPhase('finished')
  }

  function handleRetry() {
    // router.refresh() was called in ExamSession before onComplete, so
    // the server has already been asked to revalidate. Going back to idle
    // will render ExamHub with the updated pastExams from the server.
    setPhase('idle')
  }

  if (phase === 'active') {
    return <ExamSession questions={questions} onComplete={handleComplete} />
  }

  if (phase === 'finished' && result) {
    return <ExamResults result={result} onRetry={handleRetry} />
  }

  return <ExamHub pastExams={pastExams} onStart={handleStart} />
}
