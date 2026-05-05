-- ==============================================================
-- SunuPermis — Migration 004: Security & DB Hardening
-- Run in the Supabase SQL Editor (Dashboard → SQL Editor)
-- Safe to run multiple times (guards throughout)
-- ==============================================================


-- ──────────────────────────────────────────────────────────────
-- 1. driving_schools — add submitted_at, harden check constraint,
--    add missing indexes
-- ──────────────────────────────────────────────────────────────

-- submitted_at: when the school submitted its registration
ALTER TABLE public.driving_schools
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;

-- Update approval_status check constraint to include 'suspended'.
-- Step 1: drop ALL existing check constraints on the approval_status column
-- (the auto-generated name from migration 002 is non-deterministic)
DO $$
DECLARE
  c TEXT;
BEGIN
  FOR c IN
    SELECT cc.constraint_name
    FROM information_schema.check_constraints cc
    INNER JOIN information_schema.constraint_column_usage ccu
      ON cc.constraint_name   = ccu.constraint_name
     AND cc.constraint_schema = ccu.constraint_schema
    WHERE ccu.table_schema = 'public'
      AND ccu.table_name   = 'driving_schools'
      AND ccu.column_name  = 'approval_status'
  LOOP
    EXECUTE 'ALTER TABLE public.driving_schools DROP CONSTRAINT ' || quote_ident(c);
  END LOOP;
END $$;

-- Step 2: add the updated constraint with an explicit, stable name
ALTER TABLE public.driving_schools
  ADD CONSTRAINT driving_schools_approval_status_chk
  CHECK (approval_status IN ('pending', 'approved', 'rejected', 'suspended'));

-- Indexes — improve approval workflow query performance
CREATE INDEX IF NOT EXISTS driving_schools_approval_status_idx
  ON public.driving_schools(approval_status);

CREATE INDEX IF NOT EXISTS driving_schools_approved_by_idx
  ON public.driving_schools(approved_by);


-- ──────────────────────────────────────────────────────────────
-- 2. exam_questions — restrict direct student access
--    Students must go through server actions (which use the
--    service-role client); they must not be able to read
--    correct_answer or explanation via the anon/user client.
-- ──────────────────────────────────────────────────────────────

-- Ensure RLS is active on the table
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;

-- Remove any existing broad SELECT / ALL policies that allow
-- all authenticated users to read exam_questions (and therefore
-- correct_answer). We drop known names defensively.
DO $$
DECLARE
  p RECORD;
BEGIN
  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'exam_questions'
      AND cmd IN ('SELECT', 'ALL')
      AND policyname <> 'admin: full access on exam_questions'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.exam_questions',
      p.policyname
    );
  END LOOP;
END $$;

-- Admin-only access to the raw table (includes correct_answer)
-- school_admin needs read access so instructors can manage questions.
-- Students are excluded — they go through the exam_questions_public view.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'exam_questions'
      AND policyname = 'admin: full access on exam_questions'
  ) THEN
    CREATE POLICY "admin: full access on exam_questions"
      ON public.exam_questions FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE user_id = auth.uid()
            AND role IN ('super_admin', 'school_admin')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE user_id = auth.uid()
            AND role IN ('super_admin', 'school_admin')
        )
      );
  END IF;
END $$;


-- ──────────────────────────────────────────────────────────────
-- 3. exam_questions_public — safe view for student-facing code
--    Excludes correct_answer and explanation.
--    Owned by postgres → security-definer behaviour → bypasses
--    the RLS we set above, so students CAN query this view.
-- ──────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.exam_questions_public AS
SELECT
  id,
  question_text,
  options,
  category,
  difficulty,
  created_at
FROM public.exam_questions;

-- Allow any authenticated user to SELECT from the view.
-- They cannot retrieve correct_answer because the view does not project it.
GRANT SELECT ON public.exam_questions_public TO authenticated;
GRANT SELECT ON public.exam_questions_public TO anon;
