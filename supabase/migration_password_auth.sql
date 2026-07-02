-- Şifre tabanlı özel auth (Supabase Auth rate limit bypass)
ALTER TABLE public.forum_users
  ADD COLUMN IF NOT EXISTS password_hash TEXT;
