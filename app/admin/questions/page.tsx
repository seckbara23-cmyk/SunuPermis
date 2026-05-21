import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Pagination } from '@/components/ui/Pagination'
import { EXAM_CATEGORIES, CATEGORY_ICONS } from '@/lib/exam/categories'
import { toggleQuestionActive, createQuestion } from './actions'

const PAGE_SIZE = 25

const DIFFICULTY_LABELS: Record<string, { label: string; className: string }> = {
  easy:   { label: 'Facile',  className: 'bg-green-100 text-green-700' },
  medium: { label: 'Moyen',   className: 'bg-yellow-100 text-yellow-700' },
  hard:   { label: 'Difficile', className: 'bg-red-100 text-red-700' },
}

export default async function AdminQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    category?: string
    difficulty?: string
    active?: string
    new?: string
  }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'super_admin') redirect('/login')

  const {
    page: pageParam,
    category: categoryFilter,
    difficulty: diffFilter,
    active: activeFilter,
    new: showNew,
  } = await searchParams

  const page   = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const offset = (page - 1) * PAGE_SIZE

  const admin = createAdminClient()

  let query = admin
    .from('exam_questions')
    .select('id, question_text, category, difficulty, is_active, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (categoryFilter) query = query.eq('category', categoryFilter)
  if (diffFilter)     query = query.eq('difficulty', diffFilter)
  if (activeFilter === 'true')  query = query.eq('is_active', true)
  if (activeFilter === 'false') query = query.eq('is_active', false)

  const { data, count } = await query
  const questions = data ?? []
  const total     = count ?? 0

  // Totals for header
  const { count: activeCount } = await admin
    .from('exam_questions')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  const buildParams = (overrides: Record<string, string | null>) => {
    const base: Record<string, string> = {}
    if (categoryFilter) base.category = categoryFilter
    if (diffFilter)     base.difficulty = diffFilter
    if (activeFilter)   base.active = activeFilter
    for (const [k, v] of Object.entries(overrides)) {
      if (v === null) delete base[k]
      else base[k] = v
    }
    return base
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banque de questions</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} question{total !== 1 ? 's' : ''}
            {activeCount !== null && (
              <span className="text-gray-400"> · {activeCount} active{(activeCount as number) !== 1 ? 's' : ''}</span>
            )}
          </p>
        </div>
        <a
          href="?new=1"
          className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy/90 transition-colors"
        >
          + Nouvelle question
        </a>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-2 items-center">
        <select
          name="category"
          defaultValue={categoryFilter ?? ''}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-navy/20"
        >
          <option value="">Toutes catégories</option>
          {EXAM_CATEGORIES.map((c) => (
            <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>
          ))}
        </select>
        <select
          name="difficulty"
          defaultValue={diffFilter ?? ''}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-navy/20"
        >
          <option value="">Toutes difficultés</option>
          <option value="easy">Facile</option>
          <option value="medium">Moyen</option>
          <option value="hard">Difficile</option>
        </select>
        <select
          name="active"
          defaultValue={activeFilter ?? ''}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-navy/20"
        >
          <option value="">Toutes</option>
          <option value="true">Actives</option>
          <option value="false">Inactives</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-navy px-3 py-2 text-sm font-medium text-white hover:bg-navy/90 transition-colors"
        >
          Filtrer
        </button>
        {(categoryFilter || diffFilter || activeFilter) && (
          <a href="/admin/questions" className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            Réinitialiser
          </a>
        )}
      </form>

      {/* New question form */}
      {showNew === '1' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Nouvelle question</h2>
          <form action={createQuestion} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Question *</label>
              <textarea
                name="question_text"
                required
                rows={3}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                placeholder="Texte de la question..."
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Option {i + 1}{i < 2 ? ' *' : ''}</label>
                  <input
                    name="options"
                    required={i < 2}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                    placeholder={`Option ${i + 1}`}
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Bonne réponse * (doit correspondre exactement à une option)</label>
              <input
                name="correct_answer"
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                placeholder="Copiez ici le texte exact de la bonne option"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Catégorie *</label>
                <select name="category" required className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20">
                  <option value="">Choisir...</option>
                  {EXAM_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Difficulté *</label>
                <select name="difficulty" required className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20">
                  <option value="">Choisir...</option>
                  <option value="easy">Facile</option>
                  <option value="medium">Moyen</option>
                  <option value="hard">Difficile</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Explication (montrée après l&apos;examen)</label>
              <textarea
                name="explanation"
                rows={2}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                placeholder="Explication de la bonne réponse..."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Conseil d&apos;apprentissage (mode entraînement)</label>
              <input
                name="learning_tip"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
                placeholder="Conseil pédagogique court..."
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 transition-colors"
              >
                Créer la question
              </button>
              <a
                href="/admin/questions"
                className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </a>
            </div>
          </form>
        </div>
      )}

      {/* Questions table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {questions.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-gray-400">Aucune question trouvée.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr className="bg-gray-50">
                  {['Question', 'Catégorie', 'Difficulté', 'Statut', 'Créée le', 'Action'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {questions.map((q) => {
                  const diff = DIFFICULTY_LABELS[q.difficulty] ?? { label: q.difficulty, className: 'bg-gray-100 text-gray-500' }
                  return (
                    <tr key={q.id} className={`transition-colors ${!q.is_active ? 'opacity-50' : 'hover:bg-gray-50'}`}>
                      <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                        <span className="line-clamp-2">{q.question_text}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {CATEGORY_ICONS[q.category] ?? ''} {q.category}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${diff.className}`}>
                          {diff.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          q.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {q.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(q.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3">
                        <form action={toggleQuestionActive.bind(null, q.id, q.is_active)}>
                          <button
                            type="submit"
                            className={`text-xs font-medium transition-colors ${
                              q.is_active
                                ? 'text-red-500 hover:text-red-700'
                                : 'text-green-600 hover:text-green-800'
                            }`}
                          >
                            {q.is_active ? 'Désactiver' : 'Activer'}
                          </button>
                        </form>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          basePath="/admin/questions"
          searchParams={buildParams({})}
        />
      </div>
    </div>
  )
}
