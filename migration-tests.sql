-- ============================================================
-- MIGRATION: Admin-built tests + free/premium visibility
-- Run this in Supabase -> SQL Editor -> New query -> Run
-- Safe to run once. (Running twice will error on existing columns —
-- that's fine, it just means it's already applied.)
-- ============================================================

-- 1) Per-question visibility: free for everyone vs premium only
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'free'
  CHECK (visibility IN ('free', 'premium'));

-- 2) TESTS table — admin-built named tests (modules and full tests)
CREATE TABLE IF NOT EXISTS public.tests (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  -- 'module' = a single module; 'full' = a full SAT (4 modules)
  test_type TEXT NOT NULL CHECK (test_type IN ('module', 'full')),
  -- For single modules: which section
  section TEXT CHECK (section IN ('reading_writing', 'math')),
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard', 'mixed')),
  -- free for everyone, or premium only
  visibility TEXT NOT NULL DEFAULT 'premium'
    CHECK (visibility IN ('free', 'premium')),
  is_published BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3) TEST_QUESTIONS — which questions belong to a test, and in what order.
-- "slot" groups questions into modules for full tests:
--   module test  -> all rows use slot = 'module'
--   full test    -> slots: 'rw_m1','rw_m2','math_m1','math_m2'
CREATE TABLE IF NOT EXISTS public.test_questions (
  id BIGSERIAL PRIMARY KEY,
  test_id BIGINT NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  question_id BIGINT NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  slot TEXT NOT NULL DEFAULT 'module',
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_questions_test ON public.test_questions(test_id);

-- 4) Link sessions to a specific test (nullable — drills have no test)
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS test_id BIGINT REFERENCES public.tests(id) ON DELETE SET NULL;

-- ============================================================
-- ROW LEVEL SECURITY for the new tables
-- ============================================================
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_questions ENABLE ROW LEVEL SECURITY;

-- Students can read published tests; admins can read all
DROP POLICY IF EXISTS "Anyone can read published tests" ON public.tests;
CREATE POLICY "Anyone can read published tests"
  ON public.tests FOR SELECT
  TO authenticated
  USING (is_published = TRUE OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage tests" ON public.tests;
CREATE POLICY "Admins manage tests"
  ON public.tests FOR ALL
  USING (public.is_admin(auth.uid()));

-- test_questions: readable by anyone authenticated (the parent test controls access),
-- writable only by admins
DROP POLICY IF EXISTS "Anyone can read test questions" ON public.test_questions;
CREATE POLICY "Anyone can read test questions"
  ON public.test_questions FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins manage test questions" ON public.test_questions;
CREATE POLICY "Admins manage test questions"
  ON public.test_questions FOR ALL
  USING (public.is_admin(auth.uid()));

-- ============================================================
-- DONE ✅
-- ============================================================
