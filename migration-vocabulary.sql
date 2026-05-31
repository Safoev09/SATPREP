-- ============================================================
-- MIGRATION: Vocabulary
-- Run in Supabase -> SQL Editor -> New query -> Run
-- ============================================================

-- Pre-made vocabulary lists (e.g. "Essential SAT 200")
CREATE TABLE IF NOT EXISTS public.vocab_lists (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  is_published BOOLEAN DEFAULT TRUE,
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Words within those lists
CREATE TABLE IF NOT EXISTS public.vocab_words (
  id BIGSERIAL PRIMARY KEY,
  list_id BIGINT REFERENCES public.vocab_lists(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  definition TEXT NOT NULL,
  part_of_speech TEXT,
  example TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_vocab_words_list ON public.vocab_words(list_id);

-- Student's personal saved words (from highlights or manual add)
CREATE TABLE IF NOT EXISTS public.user_vocab (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  definition TEXT,
  example TEXT,
  -- Source: where they learned it
  source_type TEXT, -- 'highlight' | 'manual' | 'list'
  source_list_id BIGINT REFERENCES public.vocab_lists(id) ON DELETE SET NULL,
  -- Spaced-repetition state (simple Leitner box system)
  box INT DEFAULT 1, -- 1 (review often) → 5 (review rarely)
  next_review_at TIMESTAMPTZ DEFAULT NOW(),
  times_correct INT DEFAULT 0,
  times_seen INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, word)
);
CREATE INDEX IF NOT EXISTS idx_user_vocab_user ON public.user_vocab(user_id, next_review_at);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.vocab_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocab_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_vocab ENABLE ROW LEVEL SECURITY;

-- Lists: any logged-in user can read published; admins can manage
DROP POLICY IF EXISTS "Anyone reads published lists" ON public.vocab_lists;
CREATE POLICY "Anyone reads published lists" ON public.vocab_lists
  FOR SELECT TO authenticated USING (is_published = TRUE OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage lists" ON public.vocab_lists;
CREATE POLICY "Admins manage lists" ON public.vocab_lists
  FOR ALL USING (public.is_admin(auth.uid()));

-- Words: anyone authenticated can read; admins manage
DROP POLICY IF EXISTS "Anyone reads vocab words" ON public.vocab_words;
CREATE POLICY "Anyone reads vocab words" ON public.vocab_words
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins manage words" ON public.vocab_words;
CREATE POLICY "Admins manage words" ON public.vocab_words
  FOR ALL USING (public.is_admin(auth.uid()));

-- User vocab: each user only sees and edits their own
DROP POLICY IF EXISTS "Users see own vocab" ON public.user_vocab;
CREATE POLICY "Users see own vocab" ON public.user_vocab
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users add own vocab" ON public.user_vocab;
CREATE POLICY "Users add own vocab" ON public.user_vocab
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own vocab" ON public.user_vocab;
CREATE POLICY "Users update own vocab" ON public.user_vocab
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own vocab" ON public.user_vocab;
CREATE POLICY "Users delete own vocab" ON public.user_vocab
  FOR DELETE USING (auth.uid() = user_id);
