-- ==============================================================
-- SunuPermis — Migration 013: One active approved booking per student
-- Run in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ==============================================================
--
-- "Active" = status = 'approved' AND result IS NULL (exam not yet taken).
-- Once a result (passed/failed) is recorded on a booking, the constraint
-- is lifted and the student may be approved for another session.
--
-- IMPORTANT: Before running this migration, resolve any existing duplicates.
-- Use this query to find affected students:
--
--   SELECT student_id, COUNT(*) AS cnt
--   FROM   public.exam_bookings
--   WHERE  status = 'approved' AND result IS NULL
--   GROUP  BY student_id
--   HAVING COUNT(*) > 1;
--
-- For each duplicate, reject the older booking (keep the most recent one):
--
--   UPDATE public.exam_bookings
--   SET    status = 'rejected', updated_at = now()
--   WHERE  id = '<older_booking_id>';
--
-- Once no duplicates remain, run this migration.
-- ==============================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_exam_bookings_one_active_per_student
  ON public.exam_bookings (student_id)
  WHERE status = 'approved' AND result IS NULL;
