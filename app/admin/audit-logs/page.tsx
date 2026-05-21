import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import AuditLogsClient from './AuditLogsClient'

const PAGE_SIZE = 25

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; action?: string; page?: string }>
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (profile?.role !== 'super_admin') redirect('/login')

  const { search = '', action: actionFilter = '', page: pageStr = '1' } = await searchParams
  const page   = Math.max(1, parseInt(pageStr) || 1)
  const offset = (page - 1) * PAGE_SIZE

  // Use admin client so the profiles join always resolves regardless of RLS
  const admin = createAdminClient()

  let query = admin
    .from('audit_logs')
    .select('id, actor_role, action, entity_type, entity_id, metadata, created_at, actor:actor_profile_id(full_name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (actionFilter) {
    query = query.eq('action', actionFilter)
  }
  if (search) {
    query = query.or(
      `action.ilike.%${search}%,entity_type.ilike.%${search}%,actor_role.ilike.%${search}%`
    )
  }

  const { data: raw, count } = await query

  // PostgREST returns 1-to-1 FK joins as arrays — normalize to single object | null
  const logs = (raw ?? []).map((row) => ({
    ...row,
    actor: Array.isArray(row.actor) ? (row.actor[0] ?? null) : (row.actor ?? null),
  }))

  return (
    <AuditLogsClient
      logs={logs}
      total={count ?? 0}
      page={page}
      search={search}
      actionFilter={actionFilter}
    />
  )
}
