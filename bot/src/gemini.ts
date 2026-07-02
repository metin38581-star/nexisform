import { GoogleGenerativeAI } from "@google/generative-ai";
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

let client: GoogleGenerativeAI | null = null;

function getGemini(): GoogleGenerativeAI | null {
  const key = process.env.GOOGLE_AI_API_KEY ?? process.env.GEMINI_API_KEY;
  if (!key?.trim()) return null;

  if (!client) {
    client = new GoogleGenerativeAI(key.trim());
  }
  return client;
}

function getModel() {
  const genAI = getGemini();
  if (!genAI) return null;

  const modelName = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

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
  const model = getModel();
  const tone = pickRandom(TONES);
  const genderLabel = author.gender === "kadin" ? "kadın" : "erkek";

  if (!model) {
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

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = parseJson<{ title: string; content: string }>(text);

    if (parsed?.title?.trim() && parsed?.content?.trim()) {
      return {
        title: parsed.title.trim().slice(0, 120),
        content: parsed.content.trim().slice(0, 1200),
        source: "gemini",
      };
    }
  } catch (err) {
    console.warn("[Gemini] Soru üretilemedi:", err instanceof Error ? err.message : err);
  }

  const q = generateQuestion(category);
  return { ...q, source: "fallback" };
}

export async function generateHumanAnswer(
  question: { title: string; content: string; category?: string },
  answerer: { username: string; gender: "erkek" | "kadin" | "bot" }
): Promise<{ content: string; source: "gemini" | "fallback" }> {
  const model = getModel();
  const tone = pickRandom(ANSWER_TONES);
  const genderLabel = answerer.gender === "kadin" ? "kadın" : "erkek";

  if (!model) {
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

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = parseJson<{ content: string }>(text);

    if (parsed?.content?.trim()) {
      return {
        content: parsed.content.trim().slice(0, 900),
        source: "gemini",
      };
    }
  } catch (err) {
    console.warn("[Gemini] Cevap üretilemedi:", err instanceof Error ? err.message : err);
  }

  return { content: generateAnswer(), source: "fallback" };
}

export function isGeminiEnabled(): boolean {
  return Boolean(process.env.GOOGLE_AI_API_KEY ?? process.env.GEMINI_API_KEY);
}

export async function geminiCooldown(): Promise<void> {
  const extra = randomInt(500, 2000);
  await new Promise((r) => setTimeout(r, extra));
}
