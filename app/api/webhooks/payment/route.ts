import { type NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAuditEvent } from '@/lib/audit'
import { verifyHmacSignature } from '@/lib/payments/idempotency'

// Safe response for invalid signatures — always 401, no details
const UNAUTHORIZED = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
const BAD_REQUEST  = NextResponse.json({ error: 'Bad request' },  { status: 400 })

export async function POST(request: NextRequest) {
  // Read raw body once (needed for signature verification)
  const rawBody = await request.text()

  // ── Signature verification ─────────────────────────────────────────────────
  // TODO: Switch to provider-specific header names when integrating:
  //   Wave:         X-Wave-Signature
  //   Orange Money: X-OrangeMoney-Signature
  //   Infobip:      X-Hub-Signature
  const signature = request.headers.get('x-webhook-signature') ?? ''
  const secret    = process.env.PAYMENT_WEBHOOK_SECRET ?? ''

  if (secret) {
    if (!verifyHmacSignature(rawBody, signature, secret)) {
      console.warn('[WEBHOOK/payment] Signature mismatch', {
        ip: request.headers.get('x-forwarded-for') ?? 'unknown',
        ts: new Date().toISOString(),
      })
      return UNAUTHORIZED
    }
  } else if (process.env.NODE_ENV === 'production') {
    // Enforce secret in production — reject all unsigned requests
    console.error('[WEBHOOK/payment] PAYMENT_WEBHOOK_SECRET not set in production — request rejected')
    return UNAUTHORIZED
  }

  // ── Parse payload ──────────────────────────────────────────────────────────
  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return BAD_REQUEST
  }

  const eventId   = (payload.event_id   as string | undefined) ?? null
  const eventType = (payload.event_type as string | undefined) ?? 'unknown'
  const provider  = (payload.provider   as string | undefined) ?? 'unknown'

  // ── Idempotency guard ──────────────────────────────────────────────────────
  // Reject events we have already processed to handle provider retries safely.
  if (eventId) {
    const admin = createAdminClient()
    const { data: existing } = await admin
      .from('audit_logs')
      .select('id')
      .eq('action', 'webhook.payment_event')
      .eq('entity_id', eventId)
      .maybeSingle()

    if (existing) {
      console.log('[WEBHOOK/payment] Duplicate event ignored:', eventId)
      return NextResponse.json({ status: 'already_processed' })
    }
  }

  // ── Sanitized request log ──────────────────────────────────────────────────
  // Log receipt — do NOT log full payload (may contain card data / PII).
  console.log('[WEBHOOK/payment] Event received', {
    event_id:   eventId,
    event_type: eventType,
    provider,
    ts: new Date().toISOString(),
  })

  // ── Provider-specific routing ──────────────────────────────────────────────
  // TODO: Add per-provider handlers when integrating live gateways.
  //
  // switch (provider) {
  //   case 'wave':
  //     await handleWaveEvent(payload)
  //     break
  //   case 'orange_money':
  //     await handleOrangeMoneyEvent(payload)
  //     break
  //   default:
  //     console.warn('[WEBHOOK/payment] Unknown provider:', provider)
  // }

  // ── Audit log ──────────────────────────────────────────────────────────────
  try {
    await logAuditEvent({
      actorProfileId: null,
      actorUserId:    null,
      actorRole:      'system',
      action:         'webhook.payment_event',
      entityType:     'payment',
      entityId:       eventId ?? null,
      metadata: {
        event_type: eventType,
        provider,
        // Intentionally omit raw payload — log provider ref only
        provider_ref: payload.provider_ref ?? payload.transaction_id ?? null,
      },
    })
  } catch (err) {
    // Non-fatal — do not let audit failure cause provider retries
    console.error('[WEBHOOK/payment] Audit log failed:', err)
  }

  // Always return 200 to acknowledge receipt and prevent provider retries
  return NextResponse.json({ received: true })
}
