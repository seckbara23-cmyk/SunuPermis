import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Pagination } from '@/components/ui/Pagination'
import { getPaymentStatusConfig, PAYMENT_METHOD_LABELS } from '@/lib/payments/status'

const PAGE_SIZE = 30

const STATUS_OPTIONS = [
  { value: '',        label: 'Tous les statuts' },
  { value: 'pending', label: 'En attente' },
  { value: 'partial', label: 'Partiel' },
  { value: 'paid',    label: 'Payé' },
  { value: 'overdue', label: 'En retard' },
  { value: 'failed',  label: 'Échec' },
]

function formatFCFA(amount: number) {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA'
}

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('user_id', user.id).single()
  if (profile?.role !== 'super_admin') redirect('/login')

  const { page: pageParam, status: statusFilter } = await searchParams
  const page   = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const offset = (page - 1) * PAGE_SIZE

  const admin = createAdminClient()

  let query = admin
    .from('payments')
    .select(
      'id, amount, payment_method, status, payment_date, notes, failure_reason, gateway_status, created_at, students(full_name), driving_schools(name)',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (statusFilter) {
    query = query.eq('status', statusFilter)
  }

  const { data, count } = await query
  type PaymentRow = {
    id: string
    amount: number
    payment_method: string
    status: string
    payment_date: string
    notes: string | null
    failure_reason: string | null
    gateway_status: string | null
    created_at: string
    students: { full_name: string } | { full_name: string }[] | null
    driving_schools: { name: string } | { name: string }[] | null
  }
  const payments = (data ?? []) as unknown as PaymentRow[]
  const total = count ?? 0

  const overdueCount = statusFilter
    ? null
    : (await admin.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'overdue')).count

  const totalPaid = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paiements</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} paiement{total !== 1 ? 's' : ''}
            {overdueCount !== null && overdueCount > 0 && (
              <span className="text-red-600 font-medium"> — {overdueCount} en retard</span>
            )}
            {totalPaid > 0 && (
              <span className="text-gray-400"> · {formatFCFA(totalPaid)} encaissés (cette page)</span>
            )}
          </p>
        </div>

        {/* Status filter */}
        <form method="GET" className="flex items-center gap-2">
          <select
            name="status"
            defaultValue={statusFilter ?? ''}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-navy/20"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-navy px-3 py-2 text-sm font-medium text-white hover:bg-navy/90 transition-colors"
          >
            Filtrer
          </button>
          {statusFilter && (
            <a
              href="/admin/payments"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Réinitialiser
            </a>
          )}
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {payments.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-gray-400">Aucun paiement trouvé.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr className="bg-gray-50">
                  {['Élève', 'Auto-école', 'Montant', 'Méthode', 'Statut', 'Date paiement', 'Créé le'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((p) => {
                  const cfg = getPaymentStatusConfig(p.status)
                  const methodLabel = PAYMENT_METHOD_LABELS[p.payment_method] ?? p.payment_method
                  const isAlert = p.status === 'overdue' || p.status === 'failed'
                  const student = Array.isArray(p.students) ? (p.students[0] ?? null) : p.students
                  const school  = Array.isArray(p.driving_schools) ? (p.driving_schools[0] ?? null) : p.driving_schools
                  return (
                    <tr key={p.id} className={`transition-colors ${isAlert ? 'bg-red-50/30 hover:bg-red-50/50' : 'hover:bg-gray-50'}`}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {student?.full_name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {school?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap">
                        {formatFCFA(Number(p.amount))}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{methodLabel}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>
                          {cfg.label}
                        </span>
                        {p.gateway_status && (
                          <span className="ml-1 text-xs text-gray-400">({p.gateway_status})</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {new Date(p.payment_date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(p.created_at).toLocaleDateString('fr-FR')}
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
          basePath="/admin/payments"
          searchParams={statusFilter ? { status: statusFilter } : {}}
        />
      </div>
    </div>
  )
}
