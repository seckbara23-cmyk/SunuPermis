-- ==============================================================
-- SunuPermis — Migration 005: Appointments Table
-- Run in the Supabase SQL Editor (Dashboard → SQL Editor)
-- Safe to run multiple times (IF NOT EXISTS guards throughout)
-- ==============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. Table
-- ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.appointments (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID        NOT NULL REFERENCES public.students(id)       ON DELETE CASCADE,
  driving_school_id UUID        NOT NULL REFERENCES public.driving_schools(id) ON DELETE CASCADE,
  requested_by      UUID        REFERENCES public.profiles(id)                ON DELETE SET NULL,
  exam_session_id   UUID        REFERENCES public.exam_sessions(id)           ON DELETE SET NULL,
  scheduled_at      TIMESTAMPTZ,
  status            TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled')),
  rejection_reason  TEXT,
  confirmed_by      UUID        REFERENCES public.profiles(id)                ON DELETE SET NULL,
  confirmed_at      TIMESTAMPTZ,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS appointments_student_id_idx
  ON public.appointments(student_id);

CREATE INDEX IF NOT EXISTS appointments_school_id_idx
  ON public.appointments(driving_school_id);

CREATE INDEX IF NOT EXISTS appointments_status_idx
  ON public.appointments(status);


-- ──────────────────────────────────────────────────────────────
-- 2. RLS policies
-- ──────────────────────────────────────────────────────────────

-- super_admin: unrestricted read + write
-- Government admin needs full visibility and control over all appointments.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'appointments'
      AND policyname = 'super_admin: full access on appointments'
  ) THEN
    CREATE POLICY "super_admin: full access on appointments"
      ON public.appointments FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE user_id = auth.uid() AND role = 'super_admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE user_id = auth.uid() AND role = 'super_admin'
        )
      );
  END IF;
END $$;

-- school_admin: SELECT own school's appointments only
-- School admins may only see appointments for students in their school.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'appointments'
      AND policyname = 'school_admin: read own school appointments'
  ) THEN
    CREATE POLICY "school_admin: read own school appointments"
      ON public.appointments FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.user_id = auth.uid()
            AND p.role = 'school_admin'
            AND p.driving_school_id = driving_school_id
        )
      );
  END IF;
END $$;

-- school_admin: INSERT — create appointment requests for own school's students only.
-- Three conditions must all hold in the inserted row:
--   (a) driving_school_id matches the caller's own school
--   (b) student_id refers to a student who belongs to that same school
--   (c) status is 'pending' — school admins cannot pre-set other statuses
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'appointments'
      AND policyname = 'school_admin: request appointment for own school students'
  ) THEN
    CREATE POLICY "school_admin: request appointment for own school students"
      ON public.appointments FOR INSERT
      WITH CHECK (
        -- (a) Caller is a school_admin whose school matches the row
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.user_id         = auth.uid()
            AND p.role            = 'school_admin'
            AND p.driving_school_id = driving_school_id
        )
        -- (b) The student belongs to that same school
        AND EXISTS (
          SELECT 1 FROM public.students s
          WHERE s.id               = student_id
            AND s.driving_school_id = driving_school_id
        )
        -- (c) New appointments must start in 'pending'
        AND status = 'pending'
      );
  END IF;
END $$;

-- student: SELECT own appointment only
-- Students can view their own appointment status; nothing else.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'appointments'
      AND policyname = 'student: read own appointment'
  ) THEN
    CREATE POLICY "student: read own appointment"
      ON public.appointments FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.students s
          INNER JOIN public.profiles p ON p.user_id = auth.uid()
          WHERE s.id         = student_id
            AND s.profile_id = p.id
        )
      );
  END IF;
END $$;
