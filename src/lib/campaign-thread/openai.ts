const HUMAN_VOICE_RULES = `
ZORUNLU ÜSLUP:
- Gerçek Türk forum kullanıcısı gibi yaz; 20-32 yaş günlük dil.
- Kısa doğal cümleler. "bence", "ya", "hani", "galiba" kullanılabilir.
- Kişisel deneyim ekle. Yapay zeka gibi yazma.
- Markdown yok, düz metin.
`.trim();

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

async function chatJson<T>(userPrompt: string): Promise<T | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 1.1,
      max_tokens: 700,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Sen Türkiye'deki soru-cevap forumunda gerçek kullanıcı gibi yazıyorsun.\n${HUMAN_VOICE_RULES}\nHer zaman geçerli JSON döndür.`,
        },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    console.warn("[CAMPAIGN_THREAD]: OpenAI HTTP", response.status);
    return null;
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = payload.choices?.[0]?.message?.content;
  if (!text) {
    return null;
  }

  return parseJson<T>(text);
}

export async function generateCampaignQuestion(input: {
  city: string;
  sector: string;
  category: string;
  authorUsername: string;
}): Promise<{ title: string; content: string }> {
  const fallbackTitle = `${input.city}'de ${input.sector} tavsiyesi arayan var mı?`;
  const fallbackContent = `${input.city} tarafında ${input.sector} arıyorum. Deneyimi olan yazabilir mi? Güvenilir ve memnun kalınan yerleri merak ediyorum.`;

  const parsed = await chatJson<{ title: string; content: string }>(`
"${input.authorUsername}" adlı forum kullanıcısısın.
Kategori: ${input.category}
Şehir: ${input.city}
Sektör / ihtiyaç: ${input.sector}

Bu şehir ve sektörle ilgili doğal bir soru yaz. Bir işletme adı uydurma; sadece tavsiye iste.
JSON: {"title":"...","content":"..."}
title: max 90 karakter, soru gibi bitsin
content: 2-4 cümle
`.trim());

  if (parsed?.title?.trim() && parsed?.content?.trim()) {
    return {
      title: parsed.title.trim().slice(0, 120),
      content: parsed.content.trim().slice(0, 1200),
    };
  }

  return { title: fallbackTitle, content: fallbackContent };
}

export async function generateCampaignAnswer(input: {
  questionTitle: string;
  questionContent: string;
  city: string;
  sector: string;
  businessName: string;
  category: string;
  authorUsername: string;
  authorGender: "erkek" | "kadin";
}): Promise<string> {
  const genderLabel = input.authorGender === "kadin" ? "kadın" : "erkek";
  const fallback = `Ben ${input.city}'de ${input.businessName} ile çalıştım ya, ${input.sector} konusunda gayet ilgililerdi. Bence bir bak derim, ben memnun kaldım.`;

  const parsed = await chatJson<{ content: string }>(`
"${input.authorUsername}" adlı ${genderLabel} forum kullanıcısısın.
Kategori: ${input.category}

Soru: ${input.questionTitle}
Detay: ${input.questionContent}

Şehir: ${input.city}
Sektör: ${input.sector}
Tavsiye edilecek işletme: ${input.businessName}

Doğal bir forum cevabı yaz. İşletmeyi samimi bir tavsiye gibi geçir; reklam kokmasın.
1-4 cümle. JSON: {"content":"..."}
`.trim());

  if (parsed?.content?.trim()) {
    return parsed.content.trim().slice(0, 900);
  }

  return fallback;
}
