import { getSupabase } from "@/lib/supabase";
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

async function fetchForumUserByEmail(email: string): Promise<SessionUser | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("forum_users")
    .select("id, username, email, gender, nexis_point")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();

  if (error || !data) return null;
  return mapToSessionUser(data);
}

async function fetchForumUserById(id: string): Promise<SessionUser | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("forum_users")
    .select("id, username, email, gender, nexis_point")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return mapToSessionUser(data);
}

export async function restoreSession(): Promise<SessionUser | null> {
  const supabase = getSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user.email) {
    const profile = await fetchForumUserByEmail(session.user.email);
    if (profile) {
      writeSessionToStorage(profile);
      return profile;
    }
  }

  const stored = readSessionFromStorage();
  if (stored) {
    const profile = await fetchForumUserById(stored.id);
    if (profile) {
      writeSessionToStorage(profile);
      return profile;
    }
  }

  clearSessionFromStorage();
  return null;
}

export async function signUp(params: {
  username: string;
  email: string;
  password: string;
  gender: Gender;
}): Promise<SessionUser> {
  const supabase = getSupabase();
  const email = params.email.trim().toLowerCase();
  const username = params.username.trim();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: params.password,
  });

  if (authError) {
    throw new Error(authError.message);
  }

  const { data: profile, error: profileError } = await supabase
    .from("forum_users")
    .insert({
      username,
      email,
      gender: params.gender,
      auth_id: authData.user?.id ?? null,
      nexis_point: 0,
    })
    .select("id, username, email, gender, nexis_point")
    .single();

  if (profileError || !profile) {
    throw new Error(profileError?.message ?? "Profil oluşturulamadı.");
  }

  const sessionUser = mapToSessionUser(profile);
  writeSessionToStorage(sessionUser);

  if (!authData.session) {
    await supabase.auth.signInWithPassword({
      email,
      password: params.password,
    });
  }

  return sessionUser;
}

export async function signIn(
  email: string,
  password: string
): Promise<SessionUser> {
  const supabase = getSupabase();
  const normalizedEmail = email.trim().toLowerCase();

  const { error: authError } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (authError) {
    throw new Error(authError.message);
  }

  const profile = await fetchForumUserByEmail(normalizedEmail);
  if (!profile) {
    throw new Error("Forum profili bulunamadı.");
  }

  writeSessionToStorage(profile);
  return profile;
}

export async function logout(): Promise<void> {
  const supabase = getSupabase();
  await supabase.auth.signOut();
  clearSessionFromStorage();
}
