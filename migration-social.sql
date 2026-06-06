-- ============================================================
-- MIGRATION: Social Features (Friends, DMs, Groups, Usernames)
-- Run in Supabase → SQL Editor → New query → Run
-- Safe to run multiple times.
-- ============================================================

-- ============================================================
-- 1. Add username + friend_id to profiles
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS friend_id TEXT UNIQUE;

-- Index for fast username / friend_id lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (username);
CREATE INDEX IF NOT EXISTS idx_profiles_friend_id ON public.profiles (friend_id);

-- Auto-generate a 6-digit numeric friend_id for any profile that doesn't have one yet.
-- New profiles will get one assigned on first login via the upsert in the app.
DO $$
DECLARE
  r RECORD;
  new_id TEXT;
BEGIN
  FOR r IN SELECT id FROM public.profiles WHERE friend_id IS NULL LOOP
    LOOP
      new_id := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE friend_id = new_id);
    END LOOP;
    UPDATE public.profiles SET friend_id = new_id WHERE id = r.id;
  END LOOP;
END $$;

-- ============================================================
-- 2. Friendships table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.friendships (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (requester, recipient)
);

CREATE INDEX IF NOT EXISTS idx_friendships_requester ON public.friendships (requester);
CREATE INDEX IF NOT EXISTS idx_friendships_recipient ON public.friendships (recipient);
CREATE INDEX IF NOT EXISTS idx_friendships_status    ON public.friendships (status);

-- RLS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see their own friendships" ON public.friendships;
CREATE POLICY "Users can see their own friendships"
  ON public.friendships FOR SELECT
  USING (auth.uid() = requester OR auth.uid() = recipient);

DROP POLICY IF EXISTS "Users can send friend requests" ON public.friendships;
CREATE POLICY "Users can send friend requests"
  ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = requester);

DROP POLICY IF EXISTS "Recipients can update friendship status" ON public.friendships;
CREATE POLICY "Recipients can update friendship status"
  ON public.friendships FOR UPDATE
  USING (auth.uid() = recipient OR auth.uid() = requester);

DROP POLICY IF EXISTS "Users can delete their own friendships" ON public.friendships;
CREATE POLICY "Users can delete their own friendships"
  ON public.friendships FOR DELETE
  USING (auth.uid() = requester OR auth.uid() = recipient);

-- ============================================================
-- 3. Conversations table (DMs + Groups)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.conversations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type         TEXT NOT NULL CHECK (type IN ('dm', 'group')),
  name         TEXT,                   -- only used for groups
  created_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()  -- bumped on new message for sorting
);

CREATE INDEX IF NOT EXISTS idx_conversations_updated ON public.conversations (updated_at DESC);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. Conversation members
-- ============================================================

CREATE TABLE IF NOT EXISTS public.conversation_members (
  conversation_id  UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at        TIMESTAMPTZ DEFAULT NOW(),
  last_read_at     TIMESTAMPTZ DEFAULT NOW(),  -- for unread badge
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_members_user ON public.conversation_members (user_id);

ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;

-- Members can see their own membership rows
DROP POLICY IF EXISTS "Members can see their conversations" ON public.conversation_members;
CREATE POLICY "Members can see their conversations"
  ON public.conversation_members FOR SELECT
  USING (auth.uid() = user_id);

-- Members can see other members of conversations they belong to
DROP POLICY IF EXISTS "Members can see co-members" ON public.conversation_members;
CREATE POLICY "Members can see co-members"
  ON public.conversation_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm2
      WHERE cm2.conversation_id = conversation_members.conversation_id
        AND cm2.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can update their own last_read_at" ON public.conversation_members;
CREATE POLICY "Members can update their own last_read_at"
  ON public.conversation_members FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Members can insert themselves" ON public.conversation_members;
CREATE POLICY "Members can insert themselves"
  ON public.conversation_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS for conversations: only members can see them
DROP POLICY IF EXISTS "Members can see their conversations table" ON public.conversations;
CREATE POLICY "Members can see their conversations table"
  ON public.conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members
      WHERE conversation_id = conversations.id
        AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
CREATE POLICY "Authenticated users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Members can update conversation" ON public.conversations;
CREATE POLICY "Members can update conversation"
  ON public.conversations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members
      WHERE conversation_id = conversations.id
        AND user_id = auth.uid()
    )
  );

-- ============================================================
-- 5. Update messages table to support DMs + question shares
-- ============================================================

-- Add conversation_id (null for community channel messages)
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE;

-- Add question-share fields
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS message_type TEXT NOT NULL DEFAULT 'text'
    CHECK (message_type IN ('text', 'question_share'));

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS question_id   INTEGER REFERENCES public.questions(id) ON DELETE SET NULL;
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS shared_answer TEXT;    -- the letter the student chose (A/B/C/D)
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS was_correct   BOOLEAN; -- did they get it right?

-- Index for fast conversation message queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages (conversation_id, inserted_at DESC);

-- Update RLS: members of a conversation can read its messages
DROP POLICY IF EXISTS "Conversation members can read messages" ON public.messages;
CREATE POLICY "Conversation members can read messages"
  ON public.messages FOR SELECT
  USING (
    -- community messages (no conversation_id) — existing channels policy covers these
    conversation_id IS NULL
    OR
    -- DM/group messages — only members
    EXISTS (
      SELECT 1 FROM public.conversation_members
      WHERE conversation_id = messages.conversation_id
        AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can send messages to their conversations" ON public.messages;
CREATE POLICY "Members can send messages to their conversations"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      conversation_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.conversation_members
        WHERE conversation_id = messages.conversation_id
          AND user_id = auth.uid()
      )
    )
  );

-- ============================================================
-- 6. Helper function: get or create a DM conversation between two users
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_or_create_dm(user_a UUID, user_b UUID)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  conv_id UUID;
BEGIN
  -- Look for an existing DM between these two users
  SELECT c.id INTO conv_id
  FROM public.conversations c
  WHERE c.type = 'dm'
    AND EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = c.id AND user_id = user_a)
    AND EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = c.id AND user_id = user_b)
  LIMIT 1;

  IF conv_id IS NULL THEN
    -- Create a new DM conversation
    INSERT INTO public.conversations (type, created_by)
    VALUES ('dm', user_a)
    RETURNING id INTO conv_id;

    -- Add both members
    INSERT INTO public.conversation_members (conversation_id, user_id)
    VALUES (conv_id, user_a), (conv_id, user_b);
  END IF;

  RETURN conv_id;
END;
$$;

-- ============================================================
-- Verify:
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'profiles' AND column_name IN ('username','friend_id');
--
--   SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public'
--     AND table_name IN ('friendships','conversations','conversation_members');
-- ============================================================
