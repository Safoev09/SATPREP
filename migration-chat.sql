-- ============================================================
-- MIGRATION: Community Chat (channels + messages)
-- Run in Supabase -> SQL Editor -> New query -> Run
-- Safe to run once.
-- ============================================================

-- 1) CHANNELS — the chat rooms
CREATE TABLE IF NOT EXISTS public.channels (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  emoji TEXT DEFAULT '💬',
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2) MESSAGES — chat messages in a channel
CREATE TABLE IF NOT EXISTS public.messages (
  id BIGSERIAL PRIMARY KEY,
  channel_id BIGINT NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_channel ON public.messages(channel_id, created_at);

-- 3) Seed the starting channels
INSERT INTO public.channels (name, description, emoji, position) VALUES
  ('General', 'Talk about anything SAT-related', '💬', 1),
  ('Math help', 'Ask and answer Math questions', '🧮', 2),
  ('Reading & Writing help', 'Ask and answer R&W questions', '📖', 3),
  ('Study motivation', 'Keep each other going', '🔥', 4)
ON CONFLICT DO NOTHING;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Channels: any logged-in user can read; only admins can change them
DROP POLICY IF EXISTS "Anyone can read channels" ON public.channels;
CREATE POLICY "Anyone can read channels"
  ON public.channels FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins manage channels" ON public.channels;
CREATE POLICY "Admins manage channels"
  ON public.channels FOR ALL
  USING (public.is_admin(auth.uid()));

-- Messages: any logged-in user can read all messages
DROP POLICY IF EXISTS "Anyone can read messages" ON public.messages;
CREATE POLICY "Anyone can read messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (true);

-- Messages: a user can post messages only as themselves
DROP POLICY IF EXISTS "Users can post messages" ON public.messages;
CREATE POLICY "Users can post messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Messages: a user can delete their OWN messages; admins can delete any
DROP POLICY IF EXISTS "Users delete own messages" ON public.messages;
CREATE POLICY "Users delete own messages"
  ON public.messages FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- ============================================================
-- ENABLE REALTIME on the messages table
-- (so new messages appear instantly without refreshing)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- ============================================================
-- DONE ✅
-- ============================================================
