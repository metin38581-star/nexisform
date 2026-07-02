import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";
import {
  generateAnswer,
  generateQuestion,
  pickRandom,
  randomInt,
} from "./generators.js";

const HUMAN_VOICE_RULES = `
ZORUNLU ÜSLUP KURALLARI (buna kesinlikle uy):
- Gerçek bir Türk forum kullanıcısı gibi yaz; 20-32 yaş arası günlük konuşma dili.
- Kısa, doğal, bazen dağınık cümleler kullan. Bazen tek cümle yeter.
- "bence", "ya", "hani", "galiba", "bi", "şey", "falan" gibi sözlü kalıplar kullanabilirsin.
- Kişisel deneyim ekle: "ben de yaşadım", "kuzenimde de olmuştu" gibi.
- ASLA yapay zeka gibi yazma. Yasak ifadeler: "Merhaba", "Sonuç olarak", "Unutmamak gerekir ki",
  "Size önerim", "Harika soru", "Umarım yardımcı olabilirim", madde işaretli liste, numaralı liste,
  aşırı emoji, fazla düzgün/akademik dil, her cümlede virgül dizisi.
- Noktalama mükemmel olmak zorunda değil. Bazen "..." veya "?" yeter.
- Markdown, başlık, etiket kullanma. Düz metin.
`.trim();

const DEFAULT_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
];

let client: GoogleGenerativeAI | null = null;
let lastGeminiCallAt = 0;

function getGemini(): GoogleGenerativeAI | null {
  const key = process.env.GOOGLE_AI_API_KEY ?? process.env.GEMINI_API_KEY;
  if (!key?.trim()) return null;

  if (!client) {
    client = new GoogleGenerativeAI(key.trim());
  }
  return client;
}

function getModelNames(): string[] {
  const primary = process.env.GEMINI_MODEL?.trim();
  if (primary) {
    return [primary, ...DEFAULT_MODELS.filter((m) => m !== primary)];
  }
  return DEFAULT_MODELS;
}

function createModel(modelName: string): GenerativeModel | null {
  const genAI = getGemini();
  if (!genAI) return null;

  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 1.15,
      topP: 0.92,
      maxOutputTokens: 600,
      responseMimeType: "application/json",
    },
  });
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

function parseRetryMs(message: string): number | null {
  const match = message.match(/retry in ([0-9.]+)s/i);
  if (!match) return null;
  return Math.ceil(parseFloat(match[1]!) * 1000) + 1000;
}

function isQuotaError(message: string): boolean {
  return /429|quota|rate limit|too many requests/i.test(message);
}

function shouldTryNextModel(message: string): boolean {
  return (
    isQuotaError(message) ||
    /404|not found|not supported for generatecontent/i.test(message)
  );
}

async function waitForGeminiSlot(): Promise<void> {
  const minGap = Number(process.env.GEMINI_MIN_INTERVAL_MS ?? 90000);
  const elapsed = Date.now() - lastGeminiCallAt;
  if (elapsed < minGap) {
    await sleep(minGap - elapsed);
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function generateText(prompt: string): Promise<string | null> {
  const models = getModelNames();

  for (const modelName of models) {
    const model = createModel(modelName);
    if (!model) return null;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await waitForGeminiSlot();
        const result = await model.generateContent(prompt);
        lastGeminiCallAt = Date.now();
        return result.response.text();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const retryMs = parseRetryMs(message);

        if (shouldTryNextModel(message)) {
          if (isQuotaError(message) && retryMs && attempt === 0) {
            console.warn(`[Gemini] Kota — ${Math.round(retryMs / 1000)} sn bekleniyor (${modelName})`);
            await sleep(retryMs);
            continue;
          }
          console.warn(`[Gemini] Model atlanıyor: ${modelName}`);
          break;
        }

        console.warn(`[Gemini] Hata (${modelName}):`, message);
        break;
      }
    }
  }

  return null;
}

const TONES = [
  "biraz endişeli ve kararsız",
  "meraklı ama rahat",
  "kızgın değil ama yorulmuş",
  "utangaç, kısa soruyor",
  "samimi, arkadaşına soruyormuş gibi",
];

const ANSWER_TONES = [
  "tatsız ama dürüst",
  "destekleyici ama abartmadan",
  "kısa ve net",
  "kendi hikayesinden bahseden",
  "farklı görüş sunan",
  "şaka arası cevap veren",
];

export async function generateHumanQuestion(
  category: string,
  author: { username: string; gender: "erkek" | "kadin" | "bot" }
): Promise<{ title: string; content: string; source: "gemini" | "fallback" }> {
  const tone = pickRandom(TONES);
  const genderLabel = author.gender === "kadin" ? "kadın" : "erkek";

  if (!getGemini()) {
    const q = generateQuestion(category);
    return { ...q, source: "fallback" };
  }

  const prompt = `
Sen "${author.username}" adlı ${genderLabel} bir forum kullanıcısısın.
Kategori: ${category}
Ton: ${tone}

${HUMAN_VOICE_RULES}

Bu kategoride forumda sorulabilecek GERÇEKÇİ bir soru yaz.
Başlık merak uyandırsın ama clickbait olmasın.

Sadece şu JSON formatında cevap ver:
{"title":"...","content":"..."}

title: en fazla 90 karakter, soru gibi bitsin
content: 2-4 cümle, detay ve duygu olsun
`.trim();

  const text = await generateText(prompt);
  const parsed = text ? parseJson<{ title: string; content: string }>(text) : null;

  if (parsed?.title?.trim() && parsed?.content?.trim()) {
    return {
      title: parsed.title.trim().slice(0, 120),
      content: parsed.content.trim().slice(0, 1200),
      source: "gemini",
    };
  }

  const q = generateQuestion(category);
  return { ...q, source: "fallback" };
}

export async function generateHumanAnswer(
  question: { title: string; content: string; category?: string },
  answerer: { username: string; gender: "erkek" | "kadin" | "bot" }
): Promise<{ content: string; source: "gemini" | "fallback" }> {
  const tone = pickRandom(ANSWER_TONES);
  const genderLabel = answerer.gender === "kadin" ? "kadın" : "erkek";

  if (!getGemini()) {
    return { content: generateAnswer(), source: "fallback" };
  }

  const prompt = `
Sen "${answerer.username}" adlı ${genderLabel} bir forum kullanıcısın.
Başka birinin sorusuna cevap veriyorsun.
Ton: ${tone}

Soru başlığı: ${question.title}
Soru detayı: ${question.content}
${question.category ? `Kategori: ${question.category}` : ""}

${HUMAN_VOICE_RULES}

Soruya doğal bir forum cevabı yaz. Tavsiye verebilirsin ama öğretmen gibi değil, arkadaş gibi.
Bazen sadece 1 cümle yeter. En fazla 4 cümle.

Sadece şu JSON formatında cevap ver:
{"content":"..."}
`.trim();

  const text = await generateText(prompt);
  const parsed = text ? parseJson<{ content: string }>(text) : null;

  if (parsed?.content?.trim()) {
    return {
      content: parsed.content.trim().slice(0, 900),
      source: "gemini",
    };
  }

  return { content: generateAnswer(), source: "fallback" };
}

export function isGeminiEnabled(): boolean {
  return Boolean(process.env.GOOGLE_AI_API_KEY ?? process.env.GEMINI_API_KEY);
}

export async function geminiCooldown(): Promise<void> {
  await sleep(randomInt(1000, 3000));
}
