import OpenAI from "openai";
import {
  generateAnswer,
  generateQuestion,
  pickRandom,
  randomInt,
} from "./generators.js";

const HUMAN_VOICE_RULES = `
ZORUNLU ÜSLUP KURALLARI:
- Gerçek bir Türk forum kullanıcısı gibi yaz; 20-32 yaş günlük konuşma dili.
- Kısa, doğal cümleler. Bazen tek cümle yeter.
- "bence", "ya", "hani", "galiba", "bi", "şey", "falan" kullanabilirsin.
- Kişisel deneyim ekle: "ben de yaşadım", "kuzenimde olmuştu".
- ASLA yapay zeka gibi yazma. Yasak: "Merhaba", "Sonuç olarak", "Size önerim",
  "Harika soru", madde/numaralı liste, aşırı emoji, akademik dil.
- Markdown kullanma. Düz metin.
`.trim();

const SYSTEM_PROMPT = `Sen Türkiye'deki bir soru-cevap forumunda gerçek kullanıcı gibi yazan bir metin üreticisisin.
${HUMAN_VOICE_RULES}
Her zaman geçerli JSON döndür.`;

let client: OpenAI | null = null;
let lastCallAt = 0;

function getOpenAI(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  if (!client) client = new OpenAI({ apiKey: key });
  return client;
}

function getModel(): string {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForSlot(): Promise<void> {
  const minGap = Number(process.env.LLM_MIN_INTERVAL_MS ?? 45000);
  const elapsed = Date.now() - lastCallAt;
  if (elapsed < minGap) await sleep(minGap - elapsed);
}

function parseJson<T>(raw: string): T | null {
  try {
    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

function isRetryable(message: string): boolean {
  return /429|503|502|500|rate limit|overloaded|timeout|temporarily/i.test(message);
}

async function chatJson<T>(userPrompt: string): Promise<T | null> {
  const openai = getOpenAI();
  if (!openai) return null;

  const model = getModel();

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await waitForSlot();
      const response = await openai.chat.completions.create({
        model,
        temperature: 1.12,
        top_p: 0.92,
        max_tokens: 600,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      });

      lastCallAt = Date.now();
      const text = response.choices[0]?.message?.content;
      if (!text) return null;
      return parseJson<T>(text);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (isRetryable(message) && attempt < 2) {
        const wait = 6000 + attempt * 8000;
        console.warn(`[OpenAI] Tekrar denenecek (${model}) — ${wait / 1000}s`);
        await sleep(wait);
        continue;
      }
      console.warn(`[OpenAI] Hata (${model}):`, message);
      return null;
    }
  }

  return null;
}

const TONES = [
  "biraz endişeli ve kararsız",
  "meraklı ama rahat",
  "yorulmuş ama umutlu",
  "utangaç, kısa soruyor",
  "samimi, arkadaşına soruyormuş gibi",
];

const ANSWER_TONES = [
  "dürüst ve sade",
  "destekleyici ama abartmadan",
  "kısa ve net",
  "kendi deneyimini anlatan",
  "farklı görüş sunan",
];

export async function generateHumanQuestion(
  category: string,
  author: { username: string; gender: "erkek" | "kadin" | "bot" }
): Promise<{ title: string; content: string; source: "openai" | "fallback" }> {
  if (!getOpenAI()) {
    const q = generateQuestion(category);
    return { ...q, source: "fallback" };
  }

  const tone = pickRandom(TONES);
  const genderLabel = author.gender === "kadin" ? "kadın" : "erkek";

  const prompt = `
Sen "${author.username}" adlı ${genderLabel} bir forum kullanıcısısın.
Kategori: ${category}
Ton: ${tone}

Bu kategoride sorulabilecek gerçekçi bir soru yaz.
JSON formatı: {"title":"...","content":"..."}
title: max 90 karakter, soru gibi bitsin
content: 2-4 cümle
`.trim();

  const parsed = await chatJson<{ title: string; content: string }>(prompt);

  if (parsed?.title?.trim() && parsed?.content?.trim()) {
    return {
      title: parsed.title.trim().slice(0, 120),
      content: parsed.content.trim().slice(0, 1200),
      source: "openai",
    };
  }

  const q = generateQuestion(category);
  return { ...q, source: "fallback" };
}

export async function generateHumanAnswer(
  question: { title: string; content: string; category?: string },
  answerer: { username: string; gender: "erkek" | "kadin" | "bot" }
): Promise<{ content: string; source: "openai" | "fallback" }> {
  if (!getOpenAI()) {
    return { content: generateAnswer(), source: "fallback" };
  }

  const tone = pickRandom(ANSWER_TONES);
  const genderLabel = answerer.gender === "kadin" ? "kadın" : "erkek";

  const prompt = `
Sen "${answerer.username}" adlı ${genderLabel} bir forum kullanıcısın.
Ton: ${tone}

Soru: ${question.title}
Detay: ${question.content}
${question.category ? `Kategori: ${question.category}` : ""}

Doğal bir forum cevabı yaz. 1-4 cümle.
JSON formatı: {"content":"..."}
`.trim();

  const parsed = await chatJson<{ content: string }>(prompt);

  if (parsed?.content?.trim()) {
    return {
      content: parsed.content.trim().slice(0, 900),
      source: "openai",
    };
  }

  return { content: generateAnswer(), source: "fallback" };
}

export function isOpenAiEnabled(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export async function llmCooldown(): Promise<void> {
  await sleep(randomInt(1000, 3000));
}
