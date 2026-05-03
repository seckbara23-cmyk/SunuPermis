-- ==============================================================
-- SunuPermis — Database Schema
-- PostgreSQL / Supabase
-- ==============================================================


-- ==============================================================
-- 1. ENUMS
-- ==============================================================

CREATE TYPE user_role AS ENUM (
  'super_admin',
  'school_admin',
  'instructor',
  'student'
);

CREATE TYPE school_status AS ENUM (
  'active',
  'inactive'
);

CREATE TYPE training_status AS ENUM (
  'registered',
  'in_training',
  'ready_for_exam',
  'completed',
  'inactive'
);

CREATE TYPE payment_status AS ENUM (
  'pending',
  'partial',
  'paid',
  'overdue'
);

CREATE TYPE payment_method AS ENUM (
  'cash',
  'wave',
  'orange_money',
  'bank_transfer'
);

CREATE TYPE lesson_status AS ENUM (
  'scheduled',
  'completed',
  'cancelled',
  'missed'
);

CREATE TYPE difficulty_level AS ENUM (
  'easy',
  'medium',
  'hard'
);


-- ==============================================================
-- 2. TABLES
-- ==============================================================

-- driving_schools must come before profiles (profiles FK → driving_schools)

CREATE TABLE public.driving_schools (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  address    TEXT        NOT NULL,
  phone      TEXT,
  email      TEXT,
  status     school_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.profiles (
  id                UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID      NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name         TEXT      NOT NULL,
  phone             TEXT,
  role              user_role NOT NULL,
  driving_school_id UUID      REFERENCES public.driving_schools(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.students (
  id                UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  driving_school_id UUID           NOT NULL REFERENCES public.driving_schools(id) ON DELETE CASCADE,
  profile_id        UUID           REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name         TEXT           NOT NULL,
  phone             TEXT,
  email             TEXT,
  date_of_birth     DATE,
  license_category  TEXT           NOT NULL DEFAULT 'B',
  training_status   training_status NOT NULL DEFAULT 'registered',
  payment_status    payment_status  NOT NULL DEFAULT 'pending',
  enrollment_date   DATE           NOT NULL DEFAULT CURRENT_DATE,
  created_at        TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE TABLE public.instructors (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  driving_school_id UUID        NOT NULL REFERENCES public.driving_schools(id) ON DELETE CASCADE,
  profile_id        UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name         TEXT        NOT NULL,
  phone             TEXT,
  email             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.lessons (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID          NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  instructor_id UUID          NOT NULL REFERENCES public.instructors(id) ON DELETE RESTRICT,
  lesson_type   TEXT          NOT NULL DEFAULT 'practical',
  start_time    TIMESTAMPTZ   NOT NULL,
  end_time      TIMESTAMPTZ   NOT NULL,
  status        lesson_status NOT NULL DEFAULT 'scheduled',
  notes         TEXT,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),

  CONSTRAINT lessons_end_after_start CHECK (end_time > start_time)
);

CREATE TABLE public.exam_questions (
  id             UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text  TEXT             NOT NULL,
  options        JSONB            NOT NULL,  -- e.g. ["Option A", "Option B", "Option C"]
  correct_answer TEXT             NOT NULL,
  explanation    TEXT,
  category       TEXT             NOT NULL,
  difficulty     difficulty_level NOT NULL DEFAULT 'medium',
  created_at     TIMESTAMPTZ      NOT NULL DEFAULT now()
);

CREATE TABLE public.mock_exams (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID        NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  score           INTEGER     NOT NULL CHECK (score >= 0),
  total_questions INTEGER     NOT NULL CHECK (total_questions > 0),
  passed          BOOLEAN     NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.mock_exam_answers (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  mock_exam_id    UUID        NOT NULL REFERENCES public.mock_exams(id) ON DELETE CASCADE,
  question_id     UUID        NOT NULL REFERENCES public.exam_questions(id) ON DELETE CASCADE,
  selected_answer TEXT        NOT NULL,
  is_correct      BOOLEAN     NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.payments (
  id                UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID           NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  driving_school_id UUID           NOT NULL REFERENCES public.driving_schools(id) ON DELETE CASCADE,
  amount            NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  payment_method    payment_method NOT NULL,
  status            payment_status NOT NULL DEFAULT 'pending',
  payment_date      DATE           NOT NULL DEFAULT CURRENT_DATE,
  notes             TEXT,
  created_at        TIMESTAMPTZ    NOT NULL DEFAULT now()
);


-- ==============================================================
-- 3. INDEXES
-- ==============================================================

-- profiles
CREATE INDEX idx_profiles_user_id           ON public.profiles(user_id);
CREATE INDEX idx_profiles_driving_school_id ON public.profiles(driving_school_id);
CREATE INDEX idx_profiles_role              ON public.profiles(role);

-- students
CREATE INDEX idx_students_driving_school_id ON public.students(driving_school_id);
CREATE INDEX idx_students_profile_id        ON public.students(profile_id);
CREATE INDEX idx_students_training_status   ON public.students(training_status);
CREATE INDEX idx_students_payment_status    ON public.students(payment_status);

-- instructors
CREATE INDEX idx_instructors_driving_school_id ON public.instructors(driving_school_id);
CREATE INDEX idx_instructors_profile_id        ON public.instructors(profile_id);

-- lessons
CREATE INDEX idx_lessons_student_id    ON public.lessons(student_id);
CREATE INDEX idx_lessons_instructor_id ON public.lessons(instructor_id);
CREATE INDEX idx_lessons_start_time    ON public.lessons(start_time);
CREATE INDEX idx_lessons_status        ON public.lessons(status);

-- mock_exams
CREATE INDEX idx_mock_exams_student_id ON public.mock_exams(student_id);
CREATE INDEX idx_mock_exam_answers_exam_id ON public.mock_exam_answers(mock_exam_id);

-- payments
CREATE INDEX idx_payments_student_id        ON public.payments(student_id);
CREATE INDEX idx_payments_driving_school_id ON public.payments(driving_school_id);
CREATE INDEX idx_payments_status            ON public.payments(status);


-- ==============================================================
-- 4. HELPER FUNCTIONS
-- Called with (select fn()) in policies so they run once per
-- query, not once per row.
-- ==============================================================

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role
LANGUAGE SQL STABLE SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.get_my_school_id()
RETURNS UUID
LANGUAGE SQL STABLE SECURITY DEFINER
AS $$
  SELECT driving_school_id FROM public.profiles WHERE user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS UUID
LANGUAGE SQL STABLE SECURITY DEFINER
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
$$;


-- ==============================================================
-- 5. ROW LEVEL SECURITY — ENABLE
-- ==============================================================

ALTER TABLE public.driving_schools   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructors       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_exams        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_exam_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments          ENABLE ROW LEVEL SECURITY;


-- ==============================================================
-- 6. RLS POLICIES
-- ==============================================================

-- ------------------------------------------------------------
-- driving_schools
-- ------------------------------------------------------------

CREATE POLICY "super_admin: full access"
  ON public.driving_schools FOR ALL
  USING ((SELECT get_my_role()) = 'super_admin')
  WITH CHECK ((SELECT get_my_role()) = 'super_admin');

CREATE POLICY "school_admin: read own school"
  ON public.driving_schools FOR SELECT
  USING (id = (SELECT get_my_school_id()));

CREATE POLICY "school_admin: update own school"
  ON public.driving_schools FOR UPDATE
  USING (id = (SELECT get_my_school_id()))
  WITH CHECK (id = (SELECT get_my_school_id()));


-- ------------------------------------------------------------
-- profiles
-- ------------------------------------------------------------

CREATE POLICY "super_admin: full access"
  ON public.profiles FOR ALL
  USING ((SELECT get_my_role()) = 'super_admin')
  WITH CHECK ((SELECT get_my_role()) = 'super_admin');

CREATE POLICY "school_admin: read profiles in own school"
  ON public.profiles FOR SELECT
  USING (
    (SELECT get_my_role()) = 'school_admin'
    AND driving_school_id = (SELECT get_my_school_id())
  );

CREATE POLICY "school_admin: insert profiles in own school"
  ON public.profiles FOR INSERT
  WITH CHECK (
    (SELECT get_my_role()) = 'school_admin'
    AND driving_school_id = (SELECT get_my_school_id())
  );

CREATE POLICY "users: read own profile"
  ON public.profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "users: update own profile"
  ON public.profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ------------------------------------------------------------
-- students
-- ------------------------------------------------------------

CREATE POLICY "super_admin: full access"
  ON public.students FOR ALL
  USING ((SELECT get_my_role()) = 'super_admin')
  WITH CHECK ((SELECT get_my_role()) = 'super_admin');

CREATE POLICY "school_admin: full access to own school students"
  ON public.students FOR ALL
  USING (
    (SELECT get_my_role()) = 'school_admin'
    AND driving_school_id = (SELECT get_my_school_id())
  )
  WITH CHECK (
    (SELECT get_my_role()) = 'school_admin'
    AND driving_school_id = (SELECT get_my_school_id())
  );

CREATE POLICY "instructor: read students in own school"
  ON public.students FOR SELECT
  USING (
    (SELECT get_my_role()) = 'instructor'
    AND driving_school_id = (SELECT get_my_school_id())
  );

CREATE POLICY "student: read own record"
  ON public.students FOR SELECT
  USING (
    (SELECT get_my_role()) = 'student'
    AND profile_id = (SELECT get_my_profile_id())
  );


-- ------------------------------------------------------------
-- instructors
-- ------------------------------------------------------------

CREATE POLICY "super_admin: full access"
  ON public.instructors FOR ALL
  USING ((SELECT get_my_role()) = 'super_admin')
  WITH CHECK ((SELECT get_my_role()) = 'super_admin');

CREATE POLICY "school_admin: full access to own school instructors"
  ON public.instructors FOR ALL
  USING (
    (SELECT get_my_role()) = 'school_admin'
    AND driving_school_id = (SELECT get_my_school_id())
  )
  WITH CHECK (
    (SELECT get_my_role()) = 'school_admin'
    AND driving_school_id = (SELECT get_my_school_id())
  );

CREATE POLICY "instructor: read own record"
  ON public.instructors FOR SELECT
  USING (
    (SELECT get_my_role()) = 'instructor'
    AND profile_id = (SELECT get_my_profile_id())
  );


-- ------------------------------------------------------------
-- lessons
-- ------------------------------------------------------------

CREATE POLICY "super_admin: full access"
  ON public.lessons FOR ALL
  USING ((SELECT get_my_role()) = 'super_admin')
  WITH CHECK ((SELECT get_my_role()) = 'super_admin');

CREATE POLICY "school_admin: full access to own school lessons"
  ON public.lessons FOR ALL
  USING (
    (SELECT get_my_role()) = 'school_admin'
    AND student_id IN (
      SELECT id FROM public.students
      WHERE driving_school_id = (SELECT get_my_school_id())
    )
  )
  WITH CHECK (
    (SELECT get_my_role()) = 'school_admin'
    AND student_id IN (
      SELECT id FROM public.students
      WHERE driving_school_id = (SELECT get_my_school_id())
    )
  );

CREATE POLICY "instructor: read and update own lessons"
  ON public.lessons FOR SELECT
  USING (
    (SELECT get_my_role()) = 'instructor'
    AND instructor_id IN (
      SELECT id FROM public.instructors
      WHERE profile_id = (SELECT get_my_profile_id())
    )
  );

CREATE POLICY "instructor: update own lessons"
  ON public.lessons FOR UPDATE
  USING (
    (SELECT get_my_role()) = 'instructor'
    AND instructor_id IN (
      SELECT id FROM public.instructors
      WHERE profile_id = (SELECT get_my_profile_id())
    )
  );

CREATE POLICY "student: read own lessons"
  ON public.lessons FOR SELECT
  USING (
    (SELECT get_my_role()) = 'student'
    AND student_id IN (
      SELECT id FROM public.students
      WHERE profile_id = (SELECT get_my_profile_id())
    )
  );


-- ------------------------------------------------------------
-- exam_questions
-- ------------------------------------------------------------

CREATE POLICY "super_admin: full access"
  ON public.exam_questions FOR ALL
  USING ((SELECT get_my_role()) = 'super_admin')
  WITH CHECK ((SELECT get_my_role()) = 'super_admin');

-- All authenticated users can read questions to take exams
CREATE POLICY "authenticated: read questions"
  ON public.exam_questions FOR SELECT
  USING (auth.uid() IS NOT NULL);


-- ------------------------------------------------------------
-- mock_exams
-- ------------------------------------------------------------

CREATE POLICY "super_admin: full access"
  ON public.mock_exams FOR ALL
  USING ((SELECT get_my_role()) = 'super_admin')
  WITH CHECK ((SELECT get_my_role()) = 'super_admin');

CREATE POLICY "school_admin: read own school mock exams"
  ON public.mock_exams FOR SELECT
  USING (
    (SELECT get_my_role()) = 'school_admin'
    AND student_id IN (
      SELECT id FROM public.students
      WHERE driving_school_id = (SELECT get_my_school_id())
    )
  );

CREATE POLICY "student: full access to own mock exams"
  ON public.mock_exams FOR ALL
  USING (
    (SELECT get_my_role()) = 'student'
    AND student_id IN (
      SELECT id FROM public.students
      WHERE profile_id = (SELECT get_my_profile_id())
    )
  )
  WITH CHECK (
    (SELECT get_my_role()) = 'student'
    AND student_id IN (
      SELECT id FROM public.students
      WHERE profile_id = (SELECT get_my_profile_id())
    )
  );


-- ------------------------------------------------------------
-- mock_exam_answers
-- ------------------------------------------------------------

CREATE POLICY "super_admin: full access"
  ON public.mock_exam_answers FOR ALL
  USING ((SELECT get_my_role()) = 'super_admin')
  WITH CHECK ((SELECT get_my_role()) = 'super_admin');

CREATE POLICY "student: full access to own exam answers"
  ON public.mock_exam_answers FOR ALL
  USING (
    mock_exam_id IN (
      SELECT me.id FROM public.mock_exams me
      JOIN public.students s ON s.id = me.student_id
      WHERE s.profile_id = (SELECT get_my_profile_id())
    )
  )
  WITH CHECK (
    mock_exam_id IN (
      SELECT me.id FROM public.mock_exams me
      JOIN public.students s ON s.id = me.student_id
      WHERE s.profile_id = (SELECT get_my_profile_id())
    )
  );


-- ------------------------------------------------------------
-- payments
-- ------------------------------------------------------------

CREATE POLICY "super_admin: full access"
  ON public.payments FOR ALL
  USING ((SELECT get_my_role()) = 'super_admin')
  WITH CHECK ((SELECT get_my_role()) = 'super_admin');

CREATE POLICY "school_admin: full access to own school payments"
  ON public.payments FOR ALL
  USING (
    (SELECT get_my_role()) = 'school_admin'
    AND driving_school_id = (SELECT get_my_school_id())
  )
  WITH CHECK (
    (SELECT get_my_role()) = 'school_admin'
    AND driving_school_id = (SELECT get_my_school_id())
  );

CREATE POLICY "student: read own payments"
  ON public.payments FOR SELECT
  USING (
    (SELECT get_my_role()) = 'student'
    AND student_id IN (
      SELECT id FROM public.students
      WHERE profile_id = (SELECT get_my_profile_id())
    )
  );


-- ==============================================================
-- 7. AUTO-PROFILE TRIGGER
-- Runs after a new user is created in auth.users.
-- The caller must pass role (and optionally driving_school_id,
-- full_name, phone) in raw_user_meta_data when creating the user.
--
-- Example (Supabase Admin SDK):
--   supabase.auth.admin.createUser({
--     email: '...',
--     password: '...',
--     user_metadata: {
--       full_name: 'Amadou Diallo',
--       role: 'school_admin',
--       driving_school_id: 'uuid-here',
--     }
--   })
-- ==============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone, role, driving_school_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')::user_role,
    NULLIF(NEW.raw_user_meta_data->>'driving_school_id', '')::UUID
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
