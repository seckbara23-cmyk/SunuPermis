-- ==============================================================
-- SunuPermis — Migration 007: Audit Logs & Appointment Lifecycle
-- Run in the Supabase SQL Editor (Dashboard → SQL Editor)
-- Safe to run multiple times (IF NOT EXISTS guards throughout)
-- ==============================================================


-- ──────────────────────────────────────────────────────────────
-- 1. Audit Logs
--
-- Records every sensitive government action (approve, reject,
-- create) with actor identity and structured metadata.
-- Inserts are service-role only (no authenticated INSERT policy).
-- Reads are restricted: super_admin sees all, school_admin sees
-- only logs where metadata.driving_school_id matches their school.
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_profile_id UUID        REFERENCES public.profiles(id)  ON DELETE SET NULL,
  actor_user_id    UUID        REFERENCES auth.users(id)        ON DELETE SET NULL,
  actor_role       TEXT,
  action           TEXT        NOT NULL,
  entity_type      TEXT        NOT NULL,
  entity_id        UUID,
  metadata         JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.audit_logs IS
  'Immutable audit trail for government-sensitive actions. '
  'Inserts are server-only (service role). No UPDATE or DELETE allowed.';

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS audit_logs_actor_profile_id_idx
  ON public.audit_logs(actor_profile_id);

CREATE INDEX IF NOT EXISTS audit_logs_entity_type_entity_id_idx
  ON public.audit_logs(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx
  ON public.audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS audit_logs_action_idx
  ON public.audit_logs(action);

-- super_admin: read all audit logs
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'audit_logs'
      AND policyname = 'super_admin: read all audit logs'
  ) THEN
    CREATE POLICY "super_admin: read all audit logs"
      ON public.audit_logs FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE user_id = auth.uid() AND role = 'super_admin'
        )
      );
  END IF;
END $$;

-- school_admin: read only logs for their own driving school
-- metadata must contain driving_school_id matching their profile
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'audit_logs'
      AND policyname = 'school_admin: read own school audit logs'
  ) THEN
    CREATE POLICY "school_admin: read own school audit logs"
      ON public.audit_logs FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.user_id = auth.uid()
            AND p.role = 'school_admin'
            AND (metadata->>'driving_school_id')::uuid = p.driving_school_id
        )
      );
  END IF;
END $$;

-- No INSERT policy for authenticated users — inserts go through service role only.


-- ──────────────────────────────────────────────────────────────
-- 2. Appointment lifecycle fields
--
-- Adds explicit timestamps and actor IDs for each lifecycle
-- transition. Existing confirmed_at/confirmed_by are kept for
-- backward compatibility; approved_at/approved_by are the
-- canonical post-007 fields.
-- ──────────────────────────────────────────────────────────────

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS requested_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS approved_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rejected_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Backfill requested_at for rows that pre-date this migration
UPDATE public.appointments
  SET requested_at = created_at
WHERE requested_at IS NULL;

CREATE INDEX IF NOT EXISTS appointments_requested_at_idx
  ON public.appointments(requested_at DESC);

CREATE INDEX IF NOT EXISTS appointments_approved_by_idx
  ON public.appointments(approved_by);

CREATE INDEX IF NOT EXISTS appointments_rejected_by_idx
  ON public.appointments(rejected_by);


-- ──────────────────────────────────────────────────────────────
-- 3. updated_at auto-trigger for appointments
--
-- Ensures updated_at is always refreshed on any UPDATE without
-- requiring callers to manually set it.
-- ──────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_appointment_updated_at()
  RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_appointment_updated_at'
      AND tgrelid = 'public.appointments'::regclass
  ) THEN
    CREATE TRIGGER set_appointment_updated_at
      BEFORE UPDATE ON public.appointments
      FOR EACH ROW EXECUTE FUNCTION public.set_appointment_updated_at();
  END IF;
END $$;
