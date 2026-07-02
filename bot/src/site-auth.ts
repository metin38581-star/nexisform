const SITE_URL = (process.env.BOT_SITE_URL ?? "https://nexisaiform.com").replace(
  /\/$/,
  ""
);

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  gender: "erkek" | "kadin";
}

export interface AuthUser {
  id: string;
  username: string;
  gender: "erkek" | "kadin" | "bot";
  email?: string | null;
  nexis_point?: number;
}

async function authFetch<T>(
  path: string,
  body: Record<string, unknown>
): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
  const res = await fetch(`${SITE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as T & { error?: string };

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      error: data.error ?? `HTTP ${res.status}`,
    };
  }

  return { ok: true, data };
}

export async function registerViaSite(
  payload: RegisterPayload
): Promise<AuthUser> {
  const result = await authFetch<{ user: AuthUser }>("/api/auth/register", payload);

  if (!result.ok) {
    throw Object.assign(new Error(result.error), { status: result.status });
  }

  return result.data.user;
}

export async function loginViaSite(
  email: string,
  password: string
): Promise<AuthUser> {
  const result = await authFetch<{ user: AuthUser }>("/api/auth/login", {
    email,
    password,
  });

  if (!result.ok) {
    throw new Error(result.error);
  }

  return result.data.user;
}
