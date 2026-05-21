-- ==============================================================
-- SunuPermis — Migration 011: Student Lifecycle
-- Run in the Supabase SQL Editor (Dashboard → SQL Editor)
-- Safe to re-run (ADD COLUMN IF NOT EXISTS, idempotent indexes)
-- ==============================================================
--
-- Part 1: students — add account_status and audit fields
-- Part 2: Indexes for filtering and performance
-- ==============================================================


-- ──────────────────────────────────────────────────────────────
-- 1. students: account lifecycle columns
-- ──────────────────────────────────────────────────────────────

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS account_status    TEXT        NOT NULL DEFAULT 'active'
    CHECK (account_status IN ('active', 'suspended', 'archived')),
  ADD COLUMN IF NOT EXISTS archived_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by       UUID,
  ADD COLUMN IF NOT EXISTS reactivated_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reactivated_by    UUID,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
  ADD COLUMN IF NOT EXISTS archive_reason    TEXT;

COMMENT ON COLUMN public.students.account_status IS
  'Lifecycle status. active = normal access; suspended = login blocked, data preserved; archived = soft-deleted, login blocked. Never hard-delete.';
COMMENT ON COLUMN public.students.archived_at       IS 'Timestamp when the student was archived.';
COMMENT ON COLUMN public.students.archived_by       IS 'Profile UUID of the admin who archived the student.';
COMMENT ON COLUMN public.students.reactivated_at    IS 'Timestamp when the student was last reactivated.';
COMMENT ON COLUMN public.students.reactivated_by    IS 'Profile UUID of the admin who reactivated the student.';
COMMENT ON COLUMN public.students.suspension_reason IS 'Reason provided when suspending the student account.';
COMMENT ON COLUMN public.students.archive_reason    IS 'Reason provided when archiving the student account.';


-- ──────────────────────────────────────────────────────────────
-- 2. Indexes
-- ──────────────────────────────────────────────────────────────

-- Fast account_status filtering on list pages
CREATE INDEX IF NOT EXISTS idx_students_account_status
  ON public.students (account_status);

-- Fast school-scoped lifecycle queries (admin filter by school + status)
CREATE INDEX IF NOT EXISTS idx_students_school_account_status
  ON public.students (driving_school_id, account_status);
