import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStudentByProfileId } from '@/services/exams'
import { EXAM_CATEGORIES, CATEGORY_ICONS, PASS_THRESHOLD } from '@/lib/exam/categories'

export default async function LearningPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('user_id', user.id)
    .single()

  if (!profile || profile.role !== 'student') redirect('/student')

  const student = await getStudentByProfileId(profile.id)

  if (!student) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Mon apprentissage</h1>
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-16 text-center">
          <p className="text-gray-500 text-sm">
            Votre dossier élève n&apos;a pas encore été créé. Contactez votre auto-école.
          </p>
        </div>
      </div>
    )
  }

  const admin = createAdminClient()

  // Fetch all exams for this student
  const { data: exams } = await admin
    .from('mock_exams')
    .select('id, score, passed, mode, created_at')
    .eq('student_id', student.id)
    .order('created_at', { ascending: false })

  const allExams = exams ?? []
  const examExams = allExams.filter((e) => e.mode === 'exam' || !e.mode)
  const totalExams = allExams.length
  const passed = allExams.filter((e) => e.passed).length
  const avgScore = totalExams > 0
    ? Math.round(allExams.reduce((s, e) => s + e.score, 0) / totalExams)
    : null
  const bestScore = totalExams > 0 ? Math.max(...allExams.map((e) => e.score)) : null
  const passRate = examExams.length > 0
    ? Math.round((examExams.filter((e) => e.passed).length / examExams.length) * 100)
    : null

  // Fetch category-level stats from mock_exam_answers JOIN exam_questions
  const { data: answerRows } = await admin
    .from('mock_exam_answers')
    .select('is_correct, exam_questions!inner(category)')
    .in(
      'mock_exam_id',
      allExams.map((e) => e.id)
    )

  type AnswerRow = { is_correct: boolean; exam_questions: { category: string } | { category: string }[] }
  const rows = (answerRows ?? []) as unknown as AnswerRow[]

  const categoryStats: Record<string, { correct: number; total: number }> = {}
  for (const row of rows) {
    const q = Array.isArray(row.exam_questions) ? row.exam_questions[0] : row.exam_questions
    if (!q) continue
    if (!categoryStats[q.category]) categoryStats[q.category] = { correct: 0, total: 0 }
    categoryStats[q.category].total++
    if (row.is_correct) categoryStats[q.category].correct++
  }

  const weakCategories = Object.entries(categoryStats)
    .map(([cat, s]) => ({ cat, pct: Math.round((s.correct / s.total) * 100), ...s }))
    .filter((c) => c.pct < PASS_THRESHOLD)
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 3)

  // Last 10 exams for progression trend (oldest first)
  const trend = allExams.slice(0, 10).reverse()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mon apprentissage</h1>
        <p className="text-sm text-gray-500 mt-1">Suivez votre progression au Code de la Route</p>
      </div>

      {totalExams === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-16 text-center">
          <p className="text-gray-400 text-3xl mb-4">📚</p>
          <p className="text-gray-700 font-medium mb-1">Aucun examen encore passé</p>
          <p className="text-sm text-gray-500 mb-5">Commencez par un entraînement pour voir votre progression ici.</p>
          <Link
            href="/student/exams"
            className="inline-block rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 transition-colors"
          >
            Commencer un examen
          </Link>
        </div>
      ) : (
        <>
          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Examens passés',   value: totalExams },
              { label: 'Score moyen',      value: avgScore !== null ? `${avgScore}%` : '—' },
              { label: 'Meilleur score',   value: bestScore !== null ? `${bestScore}%` : '—' },
              { label: 'Taux de réussite', value: passRate !== null ? `${passRate}%` : '—' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Score progression */}
          {trend.length >= 2 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Progression (derniers examens)</h2>
              <div className="flex items-end gap-1 h-20">
                {trend.map((e, i) => {
                  const height = Math.max(8, (e.score / 100) * 80)
                  return (
                    <div key={e.id} className="flex-1 flex flex-col items-center gap-1" title={`${e.score}%`}>
                      <div
                        className={`w-full rounded-t-sm transition-all ${e.passed ? 'bg-green-400' : 'bg-red-300'}`}
                        style={{ height: `${height}px` }}
                      />
                      <span className="text-xs text-gray-400 hidden sm:block">{i + 1}</span>
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Plus ancien</span>
                <span>Plus récent</span>
              </div>
            </div>
          )}

          {/* Weak areas */}
          {weakCategories.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-1">Catégories à renforcer</h2>
              <p className="text-xs text-gray-400 mb-4">Catégories en dessous de {PASS_THRESHOLD}%</p>
              <div className="space-y-3">
                {weakCategories.map(({ cat, pct, correct, total }) => (
                  <div key={cat}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{CATEGORY_ICONS[cat] ?? '📋'} {cat}</span>
                      <Link
                        href={`/student/exams?category=${encodeURIComponent(cat)}`}
                        className="text-xs text-navy hover:underline font-medium"
                      >
                        S&apos;entraîner →
                      </Link>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-red-400"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-red-500 w-12 text-right">
                        {correct}/{total} ({pct}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category overview */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Par catégorie</h2>
            <div className="space-y-3">
              {EXAM_CATEGORIES.map((cat) => {
                const s = categoryStats[cat]
                if (!s) {
                  return (
                    <div key={cat} className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{CATEGORY_ICONS[cat]} {cat}</span>
                      <span className="text-xs text-gray-300">Aucune donnée</span>
                    </div>
                  )
                }
                const pct = Math.round((s.correct / s.total) * 100)
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{CATEGORY_ICONS[cat]} {cat}</span>
                      <span className={`font-semibold ${pct >= PASS_THRESHOLD ? 'text-green-600' : 'text-red-500'}`}>
                        {pct}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${pct >= PASS_THRESHOLD ? 'bg-green-500' : 'bg-red-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/student/exams"
              className="inline-block rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy/90 transition-colors"
            >
              Passer un examen blanc
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
