-- Add confirmation_reference and exam_location to appointments.
-- confirmation_reference: stable unique human-readable reference for exam-day verification.
-- Format: SP-YYYY-XXXXXX (year of confirmation + first 6 hex chars of appointment UUID, uppercase)
-- Deterministic from the appointment UUID, so re-running approveAppointment produces the same value.

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS confirmation_reference TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS exam_location          TEXT;

-- Backfill references for already-confirmed appointments (idempotent).
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id, confirmed_at
    FROM   public.appointments
    WHERE  status = 'confirmed'
      AND  confirmation_reference IS NULL
  LOOP
    UPDATE public.appointments
    SET confirmation_reference =
      'SP-' ||
      TO_CHAR(COALESCE(r.confirmed_at, NOW()), 'YYYY') || '-' ||
      UPPER(SUBSTR(REPLACE(r.id::TEXT, '-', ''), 1, 6))
    WHERE id = r.id;
  END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS idx_appointments_confirmation_reference
  ON public.appointments (confirmation_reference)
  WHERE confirmation_reference IS NOT NULL;
