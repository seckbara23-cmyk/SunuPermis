-- ==============================================================
-- SunuPermis — Migration 003: Medical Documents Storage
-- Run in the Supabase SQL Editor (Dashboard → SQL Editor)
-- Creates the 'medical-documents' private bucket and RLS policies
-- Safe to run multiple times (ON CONFLICT DO NOTHING / IF NOT EXISTS guards)
-- ==============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. Create private bucket (10 MB max, PDF + images only)
-- ──────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'medical-documents',
  'medical-documents',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────────────────────────
-- 2. Storage RLS policies
-- File path convention: {student_id}/medical-document
-- ──────────────────────────────────────────────────────────────

-- INSERT (upload): super_admin + school_admin for own students
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'medical-docs: upload'
  ) THEN
    CREATE POLICY "medical-docs: upload"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'medical-documents'
      AND (
        -- super_admin: unrestricted
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE user_id = auth.uid() AND role = 'super_admin'
        )
        OR
        -- school_admin: only for students in their school
        (
          EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid() AND role = 'school_admin'
          )
          AND EXISTS (
            SELECT 1 FROM public.students s
            INNER JOIN public.profiles p ON p.user_id = auth.uid()
            WHERE s.id::text = (storage.foldername(name))[1]
            AND s.driving_school_id = p.driving_school_id
          )
        )
      )
    );
  END IF;
END $$;

-- UPDATE (overwrite existing file): same rules as INSERT
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'medical-docs: update'
  ) THEN
    CREATE POLICY "medical-docs: update"
    ON storage.objects FOR UPDATE
    USING (
      bucket_id = 'medical-documents'
      AND (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE user_id = auth.uid() AND role = 'super_admin'
        )
        OR (
          EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid() AND role = 'school_admin'
          )
          AND EXISTS (
            SELECT 1 FROM public.students s
            INNER JOIN public.profiles p ON p.user_id = auth.uid()
            WHERE s.id::text = (storage.foldername(name))[1]
            AND s.driving_school_id = p.driving_school_id
          )
        )
      )
    );
  END IF;
END $$;

-- SELECT (read / signed URL generation):
--   super_admin: all documents
--   school_admin: own school's students
--   student: their own document only
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'medical-docs: read'
  ) THEN
    CREATE POLICY "medical-docs: read"
    ON storage.objects FOR SELECT
    USING (
      bucket_id = 'medical-documents'
      AND (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE user_id = auth.uid() AND role = 'super_admin'
        )
        OR (
          EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid() AND role = 'school_admin'
          )
          AND EXISTS (
            SELECT 1 FROM public.students s
            INNER JOIN public.profiles p ON p.user_id = auth.uid()
            WHERE s.id::text = (storage.foldername(name))[1]
            AND s.driving_school_id = p.driving_school_id
          )
        )
        OR (
          EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid() AND role = 'student'
          )
          AND EXISTS (
            SELECT 1 FROM public.students s
            INNER JOIN public.profiles p ON p.user_id = auth.uid()
            WHERE s.id::text = (storage.foldername(name))[1]
            AND s.profile_id = p.id
          )
        )
      )
    );
  END IF;
END $$;

-- DELETE: super_admin + school_admin for own students
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'medical-docs: delete'
  ) THEN
    CREATE POLICY "medical-docs: delete"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'medical-documents'
      AND (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE user_id = auth.uid() AND role = 'super_admin'
        )
        OR (
          EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid() AND role = 'school_admin'
          )
          AND EXISTS (
            SELECT 1 FROM public.students s
            INNER JOIN public.profiles p ON p.user_id = auth.uid()
            WHERE s.id::text = (storage.foldername(name))[1]
            AND s.driving_school_id = p.driving_school_id
          )
        )
      )
    );
  END IF;
END $$;
