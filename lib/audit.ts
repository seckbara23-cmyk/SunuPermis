/**
 * Shared audit-log helper.
 *
 * Uses the service-role client so it bypasses the no-insert-for-users RLS
 * policy on audit_logs. Always non-fatal for the calling workflow — errors
 * are surfaced via console.error so they appear in server logs / Vercel drain.
 *
 * Import from this file, not from services/appointments.ts, to keep audit
 * logic reusable across all server actions.
 */

import { createAdminClient } from '@/lib/supabase/admin'

export interface AuditEventParams {
  actorProfileId: string
  actorUserId:    string
  actorRole:      string
  action:         string
  entityType:     string
  entityId:       string
  metadata:       Record<string, unknown>
}

export async function logAuditEvent(params: AuditEventParams): Promise<void> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      '[AUDIT] SUPABASE_SERVICE_ROLE_KEY not set — audit log skipped.',
      'action:', params.action, 'entityId:', params.entityId,
    )
    return
  }

  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('audit_logs')
      .insert({
        actor_profile_id: params.actorProfileId,
        actor_user_id:    params.actorUserId,
        actor_role:       params.actorRole,
        action:           params.action,
        entity_type:      params.entityType,
        entity_id:        params.entityId,
        metadata:         params.metadata,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[AUDIT] Insert failed:', {
        message:    error.message,
        code:       error.code,
        action:     params.action,
        entityType: params.entityType,
        entityId:   params.entityId,
      })
    } else {
      console.log('[AUDIT] ✓', params.action, data?.id)
    }
  } catch (err) {
    console.error('[AUDIT] Unexpected error writing audit log:', err)
  }
}
