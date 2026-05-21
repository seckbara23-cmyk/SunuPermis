-- ==============================================================
-- SunuPermis — Migration 010: Learning Foundation
-- Run in the Supabase SQL Editor (Dashboard → SQL Editor)
-- Safe to re-run (ADD COLUMN IF NOT EXISTS, CREATE TABLE IF NOT EXISTS)
-- ==============================================================
--
-- Part 1: exam_questions — add is_active, learning_tip, tags
-- Part 2: Update exam_questions_public view (include learning_tip)
-- Part 3: mock_exams — add mode, duration_seconds, category_filter
-- Part 4: exam_in_progress — autosave table for resume functionality
-- Part 5: Indexes for performance
-- ==============================================================


-- ──────────────────────────────────────────────────────────────
-- 1. exam_questions: learning content columns
-- ──────────────────────────────────────────────────────────────

ALTER TABLE public.exam_questions
  ADD COLUMN IF NOT EXISTS is_active    BOOLEAN  NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS learning_tip TEXT,
  ADD COLUMN IF NOT EXISTS tags         TEXT[]   DEFAULT '{}';

COMMENT ON COLUMN public.exam_questions.is_active     IS 'Inactive questions are excluded from exams but preserved for audit.';
COMMENT ON COLUMN public.exam_questions.learning_tip  IS 'Educational tip shown to student after answering in practice mode (never contains the correct answer).';
COMMENT ON COLUMN public.exam_questions.tags          IS 'Free-form tags for admin filtering (e.g. {"priorité", "intersection"}).';


-- ──────────────────────────────────────────────────────────────
-- 2. Rebuild exam_questions_public view
--    The original view (004_hardening) had columns:
--      id, question_text, options, category, difficulty, created_at
--    We need to insert learning_tip before created_at and add the
--    is_active filter.  CREATE OR REPLACE VIEW cannot reorder or
--    insert columns mid-list (PostgreSQL 42P16), so we DROP first.
--    CASCADE is safe: the view holds no data and no other views or
--    functions depend on it.
-- ──────────────────────────────────────────────────────────────

DROP VIEW IF EXISTS public.exam_questions_public CASCADE;

CREATE VIEW public.exam_questions_public
  WITH (security_invoker = false)
AS
  SELECT
    id,
    question_text,
    options,
    category,
    difficulty,
    learning_tip,
    created_at
  FROM public.exam_questions
  WHERE is_active = true;

-- Restore grants (dropped with the view above)
GRANT SELECT ON public.exam_questions_public TO authenticated, anon;

COMMENT ON VIEW public.exam_questions_public IS
  'Safe public projection of exam_questions. Excludes correct_answer, '
  'explanation, tags, and is_active=false rows. Use for client-side question display only.';


-- ──────────────────────────────────────────────────────────────
-- 3. mock_exams: exam mode and timing columns
-- ──────────────────────────────────────────────────────────────

ALTER TABLE public.mock_exams
  ADD COLUMN IF NOT EXISTS mode             TEXT    NOT NULL DEFAULT 'exam'
    CHECK (mode IN ('exam', 'practice')),
  ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS category_filter  TEXT;

COMMENT ON COLUMN public.mock_exams.mode             IS 'exam = timed/graded mode. practice = immediate feedback mode.';
COMMENT ON COLUMN public.mock_exams.duration_seconds IS 'Elapsed seconds when the exam was submitted.';
COMMENT ON COLUMN public.mock_exams.category_filter  IS 'Category used to filter questions. NULL = all categories.';


-- ──────────────────────────────────────────────────────────────
-- 4. exam_in_progress: autosave for resume functionality
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.exam_in_progress (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID        NOT NULL UNIQUE REFERENCES public.students(id) ON DELETE CASCADE,
  question_ids    UUID[]      NOT NULL,
  answers         JSONB       NOT NULL DEFAULT '{}',
  current_index   INTEGER     NOT NULL DEFAULT 0,
  mode            TEXT        NOT NULL DEFAULT 'exam' CHECK (mode IN ('exam', 'practice')),
  category_filter TEXT,
  elapsed_seconds INTEGER     NOT NULL DEFAULT 0,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.exam_in_progress IS
  'Stores the autosaved state of an ongoing exam. Only one record per student (UNIQUE on student_id). '
  'Deleted on submission or explicit abandon. Stores question IDs only — never correct answers.';

ALTER TABLE public.exam_in_progress ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'exam_in_progress'
      AND policyname = 'student: own exam_in_progress'
  ) THEN
    CREATE POLICY "student: own exam_in_progress"
      ON public.exam_in_progress FOR ALL
      USING (
        student_id IN (
          SELECT id FROM public.students
          WHERE profile_id = (SELECT get_my_profile_id())
        )
      )
      WITH CHECK (
        student_id IN (
          SELECT id FROM public.students
          WHERE profile_id = (SELECT get_my_profile_id())
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'exam_in_progress'
      AND policyname = 'super_admin: full access exam_in_progress'
  ) THEN
    CREATE POLICY "super_admin: full access exam_in_progress"
      ON public.exam_in_progress FOR ALL
      USING  ((SELECT get_my_role()) = 'super_admin')
      WITH CHECK ((SELECT get_my_role()) = 'super_admin');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_exam_in_progress_student_id
  ON public.exam_in_progress (student_id);


-- ──────────────────────────────────────────────────────────────
-- 5. Performance indexes
-- ──────────────────────────────────────────────────────────────

-- Fast category filtering for exam question pools
CREATE INDEX IF NOT EXISTS idx_exam_questions_category_active
  ON public.exam_questions (category, is_active)
  WHERE is_active = true;

-- Fast difficulty-based queries
CREATE INDEX IF NOT EXISTS idx_exam_questions_difficulty
  ON public.exam_questions (difficulty);

-- Fast answer aggregation for category analytics
CREATE INDEX IF NOT EXISTS idx_mock_exam_answers_question_id
  ON public.mock_exam_answers (question_id);

-- Fast student-level exam history queries
CREATE INDEX IF NOT EXISTS idx_mock_exams_student_passed
  ON public.mock_exams (student_id, passed);

CREATE INDEX IF NOT EXISTS idx_mock_exams_mode
  ON public.mock_exams (mode);
