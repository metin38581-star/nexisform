import { createClient } from "@supabase/supabase-js";

export function createServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase env vars missing.");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function mapAuthError(status: number, message?: string): string {
  if (status === 429) {
    return "Çok fazla deneme yapıldı. Lütfen birkaç dakika bekleyip tekrar deneyin.";
  }
  if (status === 409) {
    return message ?? "Bu e-posta veya kullanıcı adı zaten kayıtlı.";
  }
  return message ?? "İşlem başarısız.";
}
