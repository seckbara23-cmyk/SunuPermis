-- ==============================================================
-- SunuPermis — Migration 009: Notification Lifecycle + Payment Gateway Readiness
-- Run in the Supabase SQL Editor (Dashboard → SQL Editor)
-- Safe to re-run (ADD COLUMN IF NOT EXISTS, DROP CONSTRAINT IF EXISTS guards)
-- ==============================================================
--
-- Part 1: Expand notifications table
--   - Add statuses: queued, sending, delivered, cancelled
--   - Add provider metadata columns for real provider integration
--
-- Part 2: Expand payments table
--   - Add gateway-ready columns for Wave/Orange Money integration
--   - Add idempotency key for dedup safeguards
--   - No existing status values removed (backward-compatible)
-- ==============================================================


-- ──────────────────────────────────────────────────────────────
-- 1. Notifications: expand status constraint
-- ──────────────────────────────────────────────────────────────

-- Drop the auto-named check constraint so we can expand it.
-- PostgreSQL names inline CHECK constraints as {table}_{column}_check.
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_status_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_status_check
    CHECK (status IN (
      'pending',
      'queued',
      'sending',
      'sent',
      'delivered',
      'failed',
      'cancelled'
    ));


-- ──────────────────────────────────────────────────────────────
-- 2. Notifications: add provider metadata columns
-- ──────────────────────────────────────────────────────────────

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS provider           TEXT,
  ADD COLUMN IF NOT EXISTS provider_message_id TEXT,
  ADD COLUMN IF NOT EXISTS failure_reason     TEXT,
  ADD COLUMN IF NOT EXISTS retry_count        INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sent_at            TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS metadata           JSONB;

COMMENT ON COLUMN public.notifications.provider            IS 'Provider name: mock, resend, twilio, infobip, etc.';
COMMENT ON COLUMN public.notifications.provider_message_id IS 'Provider-assigned message ID for status tracking.';
COMMENT ON COLUMN public.notifications.failure_reason      IS 'Human-readable failure reason from provider.';
COMMENT ON COLUMN public.notifications.retry_count         IS 'Number of delivery attempts made.';
COMMENT ON COLUMN public.notifications.sent_at             IS 'Timestamp when the message was accepted by the provider.';
COMMENT ON COLUMN public.notifications.delivered_at        IS 'Timestamp when delivery was confirmed (provider callback).';

-- Index for fast admin filtering by status
CREATE INDEX IF NOT EXISTS idx_notifications_status
  ON public.notifications (status);

-- Index for provider message ID lookups (delivery callbacks)
CREATE INDEX IF NOT EXISTS idx_notifications_provider_msg_id
  ON public.notifications (provider_message_id)
  WHERE provider_message_id IS NOT NULL;


-- ──────────────────────────────────────────────────────────────
-- 3. Payments: add gateway-ready columns
-- ──────────────────────────────────────────────────────────────

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS idempotency_key  TEXT,
  ADD COLUMN IF NOT EXISTS provider_ref     TEXT,
  ADD COLUMN IF NOT EXISTS gateway_status  TEXT
    CHECK (gateway_status IN (
      'initiated', 'processing', 'succeeded',
      'failed', 'expired', 'refunded', 'cancelled'
    )),
  ADD COLUMN IF NOT EXISTS initiated_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failure_reason  TEXT,
  ADD COLUMN IF NOT EXISTS provider_payload JSONB,
  ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ NOT NULL DEFAULT now();

COMMENT ON COLUMN public.payments.idempotency_key   IS 'Client-generated key to prevent duplicate payment creation. Unique per transaction attempt.';
COMMENT ON COLUMN public.payments.provider_ref       IS 'Provider-assigned payment reference (Wave transaction ID, Orange Money ref, etc.).';
COMMENT ON COLUMN public.payments.gateway_status     IS 'Provider lifecycle status: initiated → processing → succeeded/failed/expired.';
COMMENT ON COLUMN public.payments.initiated_at       IS 'Timestamp when payment was initiated with the provider.';
COMMENT ON COLUMN public.payments.completed_at       IS 'Timestamp when payment reached a terminal state (succeeded/failed/expired).';
COMMENT ON COLUMN public.payments.failure_reason     IS 'Human-readable failure description from provider or internal.';
COMMENT ON COLUMN public.payments.provider_payload   IS 'Raw provider webhook/callback payload for audit. Sanitize before storing (remove card data).';

-- Unique constraint on idempotency key to prevent duplicate records
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_idempotency_key
  ON public.payments (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Index for provider reference lookups (webhook routing)
CREATE INDEX IF NOT EXISTS idx_payments_provider_ref
  ON public.payments (provider_ref)
  WHERE provider_ref IS NOT NULL;

-- Index for gateway status filtering in admin views
CREATE INDEX IF NOT EXISTS idx_payments_gateway_status
  ON public.payments (gateway_status)
  WHERE gateway_status IS NOT NULL;
