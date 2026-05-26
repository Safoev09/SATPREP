-- ============================================================
-- MIGRATION: XP + Streak gamification
-- Run in Supabase -> SQL Editor -> New query -> Run
-- Safe to run once.
-- ============================================================

-- Add gamification fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS xp INT NOT NULL DEFAULT 0;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS current_streak INT NOT NULL DEFAULT 0;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS longest_streak INT NOT NULL DEFAULT 0;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_activity_date DATE;

-- ============================================================
-- DONE. The app updates these fields as students practise.
-- xp: total experience points earned
-- current_streak: consecutive days with practice
-- longest_streak: best streak ever
-- last_activity_date: last day the student practised
-- ============================================================
