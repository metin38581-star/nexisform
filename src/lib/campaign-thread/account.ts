import { getSiteUrl } from "@/lib/site-url";
import type { CampaignThreadUser } from "@/lib/campaign-thread/types";

const FEMALE_NAMES = [
  "Ayşe",
  "Zeynep",
  "Elif",
  "Derya",
  "Melis",
  "Büşra",
  "Seda",
  "Cansu",
  "İrem",
  "Hande",
];

const MALE_NAMES = [
  "Mehmet",
  "Can",
  "Emre",
  "Burak",
  "Kerem",
  "Mert",
  "Barış",
  "Alp",
  "Yusuf",
  "Murat",
];

const SURNAMES = [
  "Yılmaz",
  "Kaya",
  "Demir",
  "Çelik",
  "Şahin",
  "Aydın",
  "Öztürk",
  "Arslan",
  "Doğan",
  "Kurt",
];

const EMAIL_DOMAINS = [
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "yahoo.com",
] as const;

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function usernamePart(value: string): string {
  return value
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/İ/g, "i");
}

function buildUsername(): { username: string; gender: "erkek" | "kadin" } {
  const isFemale = Math.random() > 0.5;
  const first = pickRandom(isFemale ? FEMALE_NAMES : MALE_NAMES);
  const last = pickRandom(SURNAMES);
  const firstPart = usernamePart(first);
  const lastPart = usernamePart(last);
  const username = `${firstPart}_${lastPart}${randomInt(1, 99)}`;
  return { username, gender: isFemale ? "kadin" : "erkek" };
}

function buildEmail(username: string): string {
  const domain = pickRandom(EMAIL_DOMAINS);
  const base = usernamePart(username.replace(/[._]/g, ""));
  const unique = Date.now().toString().slice(-5) + randomInt(10, 99);
  return `${base}${unique}@${domain}`;
}

function buildPassword(): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let password = "";
  for (let i = 0; i < randomInt(10, 14); i += 1) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function registerCampaignThreadUser(): Promise<CampaignThreadUser> {
  const siteUrl = getSiteUrl();

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const { username, gender } = buildUsername();
    const email = buildEmail(username);
    const password = buildPassword();

    const response = await fetch(`${siteUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, gender }),
    });

    if (response.status === 409) {
      continue;
    }

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      throw new Error(payload.error ?? `Kayıt başarısız (HTTP ${response.status})`);
    }

    const payload = (await response.json()) as {
      user: { id: string; username: string; gender: "erkek" | "kadin" };
    };

    return {
      id: payload.user.id,
      username: payload.user.username,
      gender: payload.user.gender,
      email,
      password,
    };
  }

  throw new Error("Forum hesabı oluşturulamadı (çok fazla çakışma).");
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function randomDelay(minMs: number, maxMs: number): Promise<void> {
  return sleep(randomInt(minMs, maxMs));
}
