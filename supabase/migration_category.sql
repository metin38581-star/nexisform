-- Kategori sütunu eklemek için (mevcut veritabanı)
-- Supabase SQL Editor'da çalıştırın

ALTER TABLE public.forum_questions
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Genel';

CREATE INDEX IF NOT EXISTS idx_forum_questions_category
  ON public.forum_questions (category);
