import { createHash } from 'crypto'

/**
 * Generate a deterministic idempotency key for a payment intent.
 * Includes a timestamp component so repeated attempts by the same user
 * for the same amount get distinct keys (preventing accidental dedup of
 * genuine retries). The key is truncated to 32 hex characters.
 */
export function generateIdempotencyKey(
  schoolId: string,
  studentId: string,
  amount: number,
  method: string,
): string {
  const seed = `${schoolId}:${studentId}:${amount}:${method}:${Date.now()}`
  return createHash('sha256').update(seed).digest('hex').slice(0, 32)
}

/**
 * Verify HMAC-SHA256 signature for webhook payloads.
 * Used when a provider sends a signed webhook to prevent replay attacks.
 *
 * TODO: Call this in app/api/webhooks/payment/route.ts once a real
 * provider is configured and the secret is in PAYMENT_WEBHOOK_SECRET.
 */
export function verifyHmacSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  if (!secret || !signature) return false
  const expected = createHash('sha256')
    .update(secret + payload)
    .digest('hex')
  return timingSafeEqual(expected, signature)
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}
