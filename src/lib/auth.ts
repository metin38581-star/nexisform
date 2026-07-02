import type { Gender, SessionUser } from "@/lib/types";

const STORAGE_KEY = "nexis_forum_session";

function mapToSessionUser(row: {
  id: string;
  username: string;
  email: string | null;
  gender: string;
  nexis_point: number;
}): SessionUser {
  return {
    id: row.id,
    username: row.username,
    email: row.email ?? "",
    gender: row.gender as Gender,
    nexis_point: row.nexis_point ?? 0,
  };
}

export function readSessionFromStorage(): SessionUser | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function writeSessionToStorage(user: SessionUser): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearSessionFromStorage(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

async function fetchForumUserById(id: string): Promise<SessionUser | null> {
  const { getSupabase } = await import("@/lib/supabase");
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("forum_users")
    .select("id, username, email, gender, nexis_point")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return mapToSessionUser(data);
}

async function authFetch<T>(
  path: string,
  body: Record<string, unknown>
): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as T & { error?: string };

  if (!res.ok) {
    throw new Error(
      data.error ??
        (res.status === 429
          ? "Çok fazla deneme yapıldı. Lütfen birkaç dakika bekleyin."
          : "İşlem başarısız.")
    );
  }

  return data;
}

export async function restoreSession(): Promise<SessionUser | null> {
  const stored = readSessionFromStorage();
  if (!stored) return null;

  const profile = await fetchForumUserById(stored.id);
  if (!profile) {
    clearSessionFromStorage();
    return null;
  }

  writeSessionToStorage(profile);
  return profile;
}

export async function signUp(params: {
  username: string;
  email: string;
  password: string;
  gender: Gender;
}): Promise<SessionUser> {
  const { user } = await authFetch<{ user: SessionUser }>(
    "/api/auth/register",
    params
  );

  const sessionUser = mapToSessionUser(user);
  writeSessionToStorage(sessionUser);
  return sessionUser;
}

export async function signIn(
  email: string,
  password: string
): Promise<SessionUser> {
  const { user } = await authFetch<{ user: SessionUser }>("/api/auth/login", {
    email,
    password,
  });

  const sessionUser = mapToSessionUser(user);
  writeSessionToStorage(sessionUser);
  return sessionUser;
}

export async function logout(): Promise<void> {
  clearSessionFromStorage();
}
