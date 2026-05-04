-- ==============================================================
-- SunuPermis — Migration 002: Exam Workflow
-- Run in the Supabase SQL Editor (Dashboard → SQL Editor)
-- Safe to run multiple times (IF NOT EXISTS / IF NOT EXISTS guards)
-- ==============================================================


-- ──────────────────────────────────────────────────────────────
-- 1. driving_schools — add approval fields (may already exist)
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.driving_schools
  ADD COLUMN IF NOT EXISTS approval_status  TEXT NOT NULL DEFAULT 'pending'
    CHECK (approval_status IN ('pending','approved','rejected')),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS approved_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by      UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ NOT NULL DEFAULT now();


-- ──────────────────────────────────────────────────────────────
-- 2. students — add blood type and medical document fields
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS blood_type           TEXT,
  ADD COLUMN IF NOT EXISTS medical_document_url TEXT,
  ADD COLUMN IF NOT EXISTS updated_at           TIMESTAMPTZ NOT NULL DEFAULT now();


-- ──────────────────────────────────────────────────────────────
-- 3. exam_sessions
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.exam_sessions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_date       TIMESTAMPTZ NOT NULL,
  exam_center     TEXT        NOT NULL,
  available_slots INTEGER     NOT NULL DEFAULT 10 CHECK (available_slots >= 0),
  status          TEXT        NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  created_by      UUID        REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='exam_sessions' AND policyname='super_admin: full access on exam_sessions'
  ) THEN
    CREATE POLICY "super_admin: full access on exam_sessions"
      ON public.exam_sessions FOR ALL
      USING  ((SELECT get_my_role()) = 'super_admin')
      WITH CHECK ((SELECT get_my_role()) = 'super_admin');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='exam_sessions' AND policyname='school_admin: read open exam_sessions'
  ) THEN
    CREATE POLICY "school_admin: read open exam_sessions"
      ON public.exam_sessions FOR SELECT
      USING ((SELECT get_my_role()) = 'school_admin' AND status = 'open');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='exam_sessions' AND policyname='student: read open exam_sessions'
  ) THEN
    CREATE POLICY "student: read open exam_sessions"
      ON public.exam_sessions FOR SELECT
      USING ((SELECT get_my_role()) = 'student' AND status = 'open');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_exam_sessions_status    ON public.exam_sessions(status);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_exam_date ON public.exam_sessions(exam_date);


-- ──────────────────────────────────────────────────────────────
-- 4. exam_bookings
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.exam_bookings (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID        NOT NULL REFERENCES public.students(id)        ON DELETE CASCADE,
  driving_school_id UUID        NOT NULL REFERENCES public.driving_schools(id) ON DELETE CASCADE,
  exam_session_id   UUID        NOT NULL REFERENCES public.exam_sessions(id)   ON DELETE CASCADE,
  status            TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected')),
  result            TEXT        CHECK (result IN ('passed','failed')),
  approved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, exam_session_id)
);

ALTER TABLE public.exam_bookings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='exam_bookings' AND policyname='super_admin: full access on exam_bookings'
  ) THEN
    CREATE POLICY "super_admin: full access on exam_bookings"
      ON public.exam_bookings FOR ALL
      USING  ((SELECT get_my_role()) = 'super_admin')
      WITH CHECK ((SELECT get_my_role()) = 'super_admin');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='exam_bookings' AND policyname='school_admin: manage own school bookings'
  ) THEN
    CREATE POLICY "school_admin: manage own school bookings"
      ON public.exam_bookings FOR ALL
      USING  ((SELECT get_my_role()) = 'school_admin' AND driving_school_id = (SELECT get_my_school_id()))
      WITH CHECK ((SELECT get_my_role()) = 'school_admin' AND driving_school_id = (SELECT get_my_school_id()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='exam_bookings' AND policyname='student: read own exam_bookings'
  ) THEN
    CREATE POLICY "student: read own exam_bookings"
      ON public.exam_bookings FOR SELECT
      USING (
        (SELECT get_my_role()) = 'student'
        AND student_id IN (
          SELECT id FROM public.students WHERE profile_id = (SELECT get_my_profile_id())
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_exam_bookings_student_id  ON public.exam_bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_bookings_school_id   ON public.exam_bookings(driving_school_id);
CREATE INDEX IF NOT EXISTS idx_exam_bookings_session_id  ON public.exam_bookings(exam_session_id);
CREATE INDEX IF NOT EXISTS idx_exam_bookings_status      ON public.exam_bookings(status);


-- ──────────────────────────────────────────────────────────────
-- 5. notifications
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id UUID        REFERENCES auth.users(id),
  recipient_email   TEXT,
  recipient_phone   TEXT,
  channel           TEXT        NOT NULL CHECK (channel IN ('email','sms','log')),
  type              TEXT        NOT NULL,
  status            TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','sent','failed')),
  message           TEXT        NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='super_admin: full access on notifications'
  ) THEN
    CREATE POLICY "super_admin: full access on notifications"
      ON public.notifications FOR ALL
      USING  ((SELECT get_my_role()) = 'super_admin')
      WITH CHECK ((SELECT get_my_role()) = 'super_admin');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='users: read own notifications'
  ) THEN
    CREATE POLICY "users: read own notifications"
      ON public.notifications FOR SELECT
      USING (recipient_user_id = auth.uid());
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(recipient_user_id);
