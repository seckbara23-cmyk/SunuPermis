import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Pagination } from '@/components/ui/Pagination'
import {
  NOTIFICATION_STATUS_LABELS,
  NOTIFICATION_STATUS_CLASS,
  NOTIFICATION_CHANNEL_LABELS,
  NOTIFICATION_TYPE_LABELS,
} from '@/lib/notifications/constants'

const PAGE_SIZE = 30

const STATUS_OPTIONS = [
  { value: '',          label: 'Tous les statuts' },
  { value: 'failed',    label: 'Échec' },
  { value: 'pending',   label: 'En attente' },
  { value: 'queued',    label: 'En file' },
  { value: 'sending',   label: 'Envoi en cours' },
  { value: 'sent',      label: 'Envoyé' },
  { value: 'delivered', label: 'Livré' },
  { value: 'cancelled', label: 'Annulé' },
]

export default async function AdminNotificationsPage({
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
    .from('notifications')
    .select('id, channel, type, status, recipient_email, recipient_phone, failure_reason, provider, retry_count, sent_at, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (statusFilter) {
    query = query.eq('status', statusFilter)
  }

  const { data, count } = await query
  const notifications = data ?? []
  const total = count ?? 0

  const failedCount = statusFilter
    ? null
    : (await admin.from('notifications').select('*', { count: 'exact', head: true }).eq('status', 'failed')).count

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} notification{total !== 1 ? 's' : ''}
            {failedCount !== null && failedCount > 0 && (
              <span className="text-red-600 font-medium"> — {failedCount} en échec</span>
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
              href="/admin/notifications"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Réinitialiser
            </a>
          )}
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {notifications.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-gray-400">Aucune notification trouvée.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr className="bg-gray-50">
                  {['Type', 'Canal', 'Destinataire', 'Statut', 'Fournisseur', 'Erreur', 'Date'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {notifications.map((n) => {
                  const statusCls = NOTIFICATION_STATUS_CLASS[n.status] ?? 'bg-gray-100 text-gray-600'
                  const statusLbl = NOTIFICATION_STATUS_LABELS[n.status] ?? n.status
                  const channelLbl = NOTIFICATION_CHANNEL_LABELS[n.channel] ?? n.channel
                  const typeLbl  = NOTIFICATION_TYPE_LABELS[n.type] ?? n.type
                  const recipient = n.recipient_email ?? n.recipient_phone ?? '—'
                  return (
                    <tr key={n.id} className={`transition-colors ${n.status === 'failed' ? 'bg-red-50/30 hover:bg-red-50/50' : 'hover:bg-gray-50'}`}>
                      <td className="px-4 py-3 text-sm text-gray-800 font-medium whitespace-nowrap">{typeLbl}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{channelLbl}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">{recipient}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCls}`}>
                          {statusLbl}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{n.provider ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-red-600 max-w-[200px] truncate">
                        {n.failure_reason ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(n.created_at).toLocaleString('fr-FR', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
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
          basePath="/admin/notifications"
          searchParams={statusFilter ? { status: statusFilter } : {}}
        />
      </div>
    </div>
  )
}
