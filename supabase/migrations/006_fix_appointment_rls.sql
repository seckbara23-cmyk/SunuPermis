-- ==============================================================
-- SunuPermis — Migration 006: Fix appointment INSERT RLS policy
-- Run in the Supabase SQL Editor (Dashboard → SQL Editor)
-- Safe to run multiple times
-- ==============================================================

-- Drop the INSERT policy from migration 005.
-- It had two problems:
--   1. Column refs like `driving_school_id` were ambiguous (could resolve to
--      the outer appointments table or a subquery alias).
--   2. It did not verify `appointments.requested_by = profiles.id`, so a
--      school admin could submit an insert with any UUID in requested_by.
DROP POLICY IF EXISTS "school_admin: request appointment for own school students" ON public.appointments;

-- Corrected INSERT policy:
--   • All column references are fully-qualified with the table alias or
--     the `appointments` keyword so there is no ambiguity.
--   • A single EXISTS with JOIN replaces two separate EXISTS subqueries,
--     which is more efficient and harder to mis-read.
--   • appointments.requested_by = p.id is now enforced.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'appointments'
      AND policyname = 'school_admin: create appointment for own school students'
  ) THEN
    CREATE POLICY "school_admin: create appointment for own school students"
      ON public.appointments
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.profiles p
          JOIN public.students s ON s.id = appointments.student_id
          WHERE p.user_id              = auth.uid()
            AND p.role                  = 'school_admin'
            AND p.driving_school_id     = appointments.driving_school_id
            AND s.driving_school_id     = p.driving_school_id
            AND appointments.requested_by = p.id
            AND appointments.status       = 'pending'
        )
      );
  END IF;
END $$;
