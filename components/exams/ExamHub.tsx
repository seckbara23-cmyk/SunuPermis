'use client'

import { useState } from 'react'
import type { MockExam, ExamMode, InProgressExam } from '@/types'
import { EXAM_CATEGORIES, CATEGORY_ICONS, PASS_THRESHOLD, EXAM_SIZE } from '@/lib/exam/categories'
import { startExam, clearExamProgress } from '@/app/student/mock-exams/actions'

interface Props {
  pastExams: MockExam[]
  inProgressExam: InProgressExam | null
  onStart: (exam: InProgressExam) => void
}

export default function ExamHub({ pastExams, inProgressExam, onStart }: Props) {
  const [mode, setMode] = useState<ExamMode>('exam')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [discarding, setDiscarding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleStart() {
    setError(null)
    setLoading(true)
    const { exam, error } = await startExam({ mode, categoryFilter })
    setLoading(false)
    if (error || !exam) {
      setError(error ?? 'Impossible de charger les questions.')
      return
    }
    onStart(exam)
  }

  async function handleResume() {
    if (!inProgressExam) return
    onStart(inProgressExam)
  }

  async function handleDiscard() {
    setDiscarding(true)
    await clearExamProgress()
    setDiscarding(false)
    // Page refresh will clear the inProgressExam prop from server
    window.location.reload()
  }

  const bestScore = pastExams.length ? Math.max(...pastExams.map((e) => e.score)) : null
  const passRate = pastExams.length
    ? Math.round((pastExams.filter((e) => e.passed).length / pastExams.length) * 100)
    : null

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Examens blancs</h1>

      {/* Stats row */}
      {pastExams.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Examens passés',   value: pastExams.length },
            { label: 'Meilleur score',   value: `${bestScore}%` },
            { label: 'Taux de réussite', value: `${passRate}%` },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Resume prompt */}
      {inProgressExam && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-6 py-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Examen en cours</p>
            <p className="text-xs text-amber-700 mt-0.5">
              {inProgressExam.mode === 'practice' ? 'Mode entraînement' : 'Mode examen'} ·{' '}
              {inProgressExam.categoryFilter ?? 'Toutes catégories'} ·{' '}
              {Object.keys(inProgressExam.answers).length}/{inProgressExam.questions.length} réponse(s)
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={handleResume}
              className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 transition-colors"
            >
              Reprendre
            </button>
            <button
              onClick={handleDiscard}
              disabled={discarding}
              className="rounded-lg border border-amber-300 px-4 py-2 text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50 transition-colors"
            >
              {discarding ? '...' : 'Abandonner'}
            </button>
          </div>
        </div>
      )}

      {/* Start card */}
      <div className="bg-white rounded-2xl border border-gray-200 px-6 py-8 mb-8">
        <div className="w-14 h-14 bg-navy/10 rounded-2xl flex items-center justify-center mx-auto mb-5 text-3xl">
          📝
        </div>
        <h2 className="text-lg font-semibold text-gray-900 text-center mb-1">
          Prêt pour un examen blanc ?
        </h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          {EXAM_SIZE} questions aléatoires · Score minimum :{' '}
          <span className="font-semibold text-gray-700">{PASS_THRESHOLD}%</span>
        </p>

        {/* Mode selector */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Mode</p>
          <div className="grid grid-cols-2 gap-2">
            {(['exam', 'practice'] as ExamMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-xl border-2 px-4 py-3 text-sm text-left transition-all ${
                  mode === m
                    ? 'border-navy bg-navy/5 text-navy font-semibold'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {m === 'exam' ? (
                  <>
                    <span className="block font-medium">⏱ Examen</span>
                    <span className="block text-xs text-gray-500 mt-0.5">Chrono · Score final</span>
                  </>
                ) : (
                  <>
                    <span className="block font-medium">📚 Entraînement</span>
                    <span className="block text-xs text-gray-500 mt-0.5">Feedback immédiat</span>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Category filter */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Catégorie</p>
          <select
            value={categoryFilter ?? ''}
            onChange={(e) => setCategoryFilter(e.target.value || null)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-navy/20"
          >
            <option value="">Toutes les catégories</option>
            {EXAM_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_ICONS[cat]} {cat}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-red-600 text-sm mb-4 text-center">{error}</p>}

        <button
          onClick={handleStart}
          disabled={loading}
          className="w-full rounded-lg bg-navy px-8 py-3 text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
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
                  {['Date', 'Score', 'Mode', 'Résultat'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pastExams.map((exam) => {
                  const correct = Math.round((exam.score * exam.total_questions) / 100)
                  return (
                    <tr key={exam.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 text-sm text-gray-600">
                        {new Date(exam.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'long', year: 'numeric',
                        })}
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-gray-900">
                        {exam.score}%{' '}
                        <span className="text-gray-400 font-normal">({correct}/{exam.total_questions})</span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500">
                        {exam.mode === 'practice' ? 'Entraînement' : 'Examen'}
                      </td>
                      <td className="px-5 py-4">
                        {exam.mode === 'practice' ? (
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700">
                            Pratique
                          </span>
                        ) : exam.passed ? (
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
