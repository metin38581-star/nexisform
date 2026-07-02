-- Mevcut veritabanına uygulamak için (schema.sql zaten çalıştırıldıysa)
-- Supabase SQL Editor'da çalıştırın

ALTER TABLE public.forum_users
  ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;

ALTER TABLE public.forum_questions
  ADD COLUMN IF NOT EXISTS likes_count INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS forum_users_email_unique
  ON public.forum_users (email)
  WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.forum_question_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.forum_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.forum_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (question_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_forum_question_likes_question
  ON public.forum_question_likes (question_id);

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

ALTER TABLE public.forum_question_likes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "forum_question_likes_select" ON public.forum_question_likes
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "forum_question_likes_insert" ON public.forum_question_likes
    FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "forum_question_likes_delete" ON public.forum_question_likes
    FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_question_likes;
