-- Nexis Forum — Supabase schema
-- Run this in Supabase SQL Editor or via migration

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.forum_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  email TEXT UNIQUE,
  gender TEXT NOT NULL CHECK (gender IN ('erkek', 'kadin', 'bot')),
  nexis_point INTEGER NOT NULL DEFAULT 0,
  auth_id UUID UNIQUE,
  password_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.forum_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Genel',
  views_count INTEGER NOT NULL DEFAULT 0,
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.forum_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.forum_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_best_answer BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_forum_questions_created_at
  ON public.forum_questions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_forum_questions_slug
  ON public.forum_questions (slug);

CREATE INDEX IF NOT EXISTS idx_forum_questions_category
  ON public.forum_questions (category);

CREATE INDEX IF NOT EXISTS idx_forum_answers_question_id
  ON public.forum_answers (question_id, created_at ASC);

CREATE TABLE IF NOT EXISTS public.forum_question_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.forum_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (question_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_forum_question_likes_question
  ON public.forum_question_likes (question_id);

-- Auto-sync likes_count on forum_questions
CREATE OR REPLACE FUNCTION public.sync_question_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forum_questions
    SET likes_count = likes_count + 1
    WHERE id = NEW.question_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forum_questions
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.question_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_question_likes_count ON public.forum_question_likes;
CREATE TRIGGER trg_sync_question_likes_count
AFTER INSERT OR DELETE ON public.forum_question_likes
FOR EACH ROW EXECUTE FUNCTION public.sync_question_likes_count();

-- RLS
ALTER TABLE public.forum_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_question_likes ENABLE ROW LEVEL SECURITY;

-- Public read for all tables (anon key)
CREATE POLICY "forum_users_select" ON public.forum_users
  FOR SELECT USING (true);

CREATE POLICY "forum_users_insert" ON public.forum_users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "forum_questions_select" ON public.forum_questions
  FOR SELECT USING (true);

CREATE POLICY "forum_questions_insert" ON public.forum_questions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "forum_questions_update" ON public.forum_questions
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "forum_answers_select" ON public.forum_answers
  FOR SELECT USING (true);

CREATE POLICY "forum_answers_insert" ON public.forum_answers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "forum_question_likes_select" ON public.forum_question_likes
  FOR SELECT USING (true);

CREATE POLICY "forum_question_likes_insert" ON public.forum_question_likes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "forum_question_likes_delete" ON public.forum_question_likes
  FOR DELETE USING (true);

-- Realtime (enable in Supabase Dashboard > Database > Replication if needed)
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_questions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_answers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_question_likes;
