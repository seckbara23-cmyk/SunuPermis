'use client'

import { useState } from 'react'
import type { MockExam, ExamQuestionForDisplay } from '@/types'
import { fetchExamQuestions } from '@/app/dashboard/exams/actions'

interface Props {
  pastExams: MockExam[]
  onStart: (questions: ExamQuestionForDisplay[]) => void
}

export default function ExamHub({ pastExams, onStart }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleStart() {
    setError(null)
    setLoading(true)

    const { questions, error } = await fetchExamQuestions()

    if (error || !questions) {
      setError(error ?? 'Impossible de charger les questions.')
      setLoading(false)
      return
    }

    onStart(questions)
  }

  const bestScore = pastExams.length
    ? Math.max(...pastExams.map((e) => e.score))
    : null

  const passRate = pastExams.length
    ? Math.round((pastExams.filter((e) => e.passed).length / pastExams.length) * 100)
    : null

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Examens blancs</h1>

      {/* Stats row — only if past exams exist */}
      {pastExams.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Examens passés', value: pastExams.length },
            { label: 'Meilleur score', value: `${bestScore}%` },
            { label: 'Taux de réussite', value: `${passRate}%` },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Start card */}
      <div className="bg-white rounded-2xl border border-gray-200 px-8 py-10 text-center mb-8">
        <div className="w-16 h-16 bg-navy/10 rounded-2xl flex items-center justify-center mx-auto mb-5 text-3xl">
          📝
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Prêt pour un examen blanc ?
        </h2>
        <p className="text-sm text-gray-500 mb-1">10 questions aléatoires du Code de la Route</p>
        <p className="text-sm text-gray-500 mb-7">
          Score minimum pour réussir :{' '}
          <span className="font-semibold text-gray-700">80%</span> (8/10)
        </p>

        {error && (
          <p className="text-red-600 text-sm mb-4">{error}</p>
        )}

        <button
          onClick={handleStart}
          disabled={loading}
          className="rounded-lg bg-navy px-8 py-3 text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Chargement des questions...' : 'Commencer l\'examen'}
        </button>
      </div>

      {/* History */}
      {pastExams.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Historique</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Date
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Score
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Résultat
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pastExams.map((exam) => {
                  const correct = Math.round(
                    (exam.score * exam.total_questions) / 100
                  )
                  return (
                    <tr key={exam.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 text-sm text-gray-600">
                        {new Date(exam.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-gray-900">
                        {exam.score}%{' '}
                        <span className="text-gray-400 font-normal">
                          ({correct}/{exam.total_questions})
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {exam.passed ? (
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-700">
                            Réussi
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-700">
                            Échoué
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
