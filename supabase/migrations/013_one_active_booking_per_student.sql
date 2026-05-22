-- ==============================================================
-- SunuPermis — Migration 013: One active approved booking per student
-- Run in the Supabase SQL Editor (Dashboard → SQL Editor)
-- Safe to run multiple times (CTE dedup is idempotent; IF NOT EXISTS guards)
-- ==============================================================
--
-- "Active" = status = 'approved' AND result IS NULL (exam not yet taken).
-- Once a result (passed/failed) is recorded the constraint is lifted so the
-- student may be approved for a subsequent session.
--
-- Step 1 resolves existing duplicates automatically before Step 2 creates
-- the index — no manual pre-flight required.
-- ==============================================================


-- ── Step 1: Resolve existing duplicate active bookings ────────────────────────
-- For each student who has more than one active approved booking, keep the
-- most-recently-created one and reject the rest.

WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY student_id
           ORDER BY created_at DESC
         ) AS rn
  FROM   public.exam_bookings
  WHERE  status = 'approved'
    AND  result IS NULL
)
UPDATE public.exam_bookings
SET    status     = 'rejected',
       updated_at = now()
WHERE  id IN (
  SELECT id FROM ranked WHERE rn > 1
);


-- ── Step 2: Enforce the constraint going forward ──────────────────────────────

CREATE UNIQUE INDEX IF NOT EXISTS idx_exam_bookings_one_active_per_student
  ON public.exam_bookings (student_id)
  WHERE status = 'approved' AND result IS NULL;
