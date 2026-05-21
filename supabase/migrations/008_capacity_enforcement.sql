-- ==============================================================
-- SunuPermis — Migration 008: Exam Session Capacity Enforcement
-- Run in the Supabase SQL Editor (Dashboard → SQL Editor)
-- Safe to re-run (CREATE OR REPLACE + DROP IF EXISTS guards)
-- ==============================================================
--
-- Purpose:
--   Prevents overbooking of exam_sessions at the database level via a
--   BEFORE INSERT OR UPDATE trigger. Application-level checks remain in
--   place, but this trigger is the authoritative last line of defence,
--   handling concurrent requests that could race past app-level guards.
--
-- Capacity rules:
--   - Only bookings with status IN ('pending', 'approved') count toward
--     the session's available_slots limit.
--   - Rejected / future-cancelled bookings do not consume a slot.
--   - The exam_sessions row is locked FOR UPDATE before counting to
--     serialize concurrent inserts on the same session.
--
-- Error token:
--   Raises EXCEPTION with prefix 'CAPACITY_EXCEEDED:' so application
--   code can pattern-match and return a clean French error message.
-- ==============================================================


-- ──────────────────────────────────────────────────────────────
-- 1. Capacity-enforcement trigger function
-- ──────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.enforce_exam_session_capacity()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_slots        INTEGER;
  v_active_count INTEGER;
BEGIN
  -- Only enforce when a booking is being made active.
  -- 'rejected' bookings do not count, so transitions to/from rejected
  -- do not need a capacity check.
  IF NEW.status NOT IN ('pending', 'approved') THEN
    RETURN NEW;
  END IF;

  -- Skip if an UPDATE keeps the booking in an already-active status.
  -- Example: pending → approved does not increase the active count.
  IF TG_OP = 'UPDATE' AND OLD.status IN ('pending', 'approved') THEN
    RETURN NEW;
  END IF;

  -- Lock the session row to prevent two concurrent transactions from
  -- both seeing "1 slot available" and both succeeding.
  SELECT available_slots
    INTO v_slots
    FROM public.exam_sessions
   WHERE id = NEW.exam_session_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SESSION_NOT_FOUND: Session d''examen introuvable (id: %).', NEW.exam_session_id;
  END IF;

  -- Count currently-active bookings for this session.
  -- On UPDATE, exclude the row being updated (its old status was not active,
  -- but the id is present in the table so we exclude it defensively).
  SELECT COUNT(*)
    INTO v_active_count
    FROM public.exam_bookings
   WHERE exam_session_id = NEW.exam_session_id
     AND status IN ('pending', 'approved')
     AND (TG_OP = 'INSERT' OR id <> OLD.id);

  IF v_active_count >= v_slots THEN
    RAISE EXCEPTION
      'CAPACITY_EXCEEDED: La session d''examen est complète (% place(s) disponible(s), % réservation(s) active(s)).',
      v_slots, v_active_count;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_exam_session_capacity() IS
  'BEFORE INSERT OR UPDATE trigger on exam_bookings. '
  'Serialises concurrent bookings via FOR UPDATE on exam_sessions and '
  'raises CAPACITY_EXCEEDED if available_slots would be exceeded. '
  'Only pending/approved bookings count toward capacity.';


-- ──────────────────────────────────────────────────────────────
-- 2. Attach trigger to exam_bookings
-- ──────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS enforce_exam_session_capacity ON public.exam_bookings;

CREATE TRIGGER enforce_exam_session_capacity
  BEFORE INSERT OR UPDATE ON public.exam_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_exam_session_capacity();


-- ──────────────────────────────────────────────────────────────
-- 3. Index to make the COUNT sub-query fast at scale
--    (exam_session_id + status used by the trigger every INSERT)
-- ──────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_exam_bookings_session_active
  ON public.exam_bookings (exam_session_id, status)
  WHERE status IN ('pending', 'approved');
