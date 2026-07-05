import type { ForumCategory } from "@/lib/categories";

/** NexisAI sektör etiketini forum kategorisine eşler. */
export function mapSectorToForumCategory(
  sector: string,
  sectorSlug?: string,
): ForumCategory {
  const slug = (sectorSlug ?? "").toLowerCase();
  const label = sector.toLowerCase();

  if (
    slug.includes("dis") ||
    slug.includes("saglik") ||
    slug.includes("klinik") ||
    slug.includes("otel") ||
    /diş|sağlık|klinik|hastane|doktor|otel|konaklama/.test(label)
  ) {
    if (/otel|konaklama/.test(label) || slug.includes("otel")) {
      return "Yaşam";
    }
    return "Sağlık";
  }

  if (
    /güzellik|saç|estetik|moda|giyim|e-ticaret/.test(label) ||
    slug.includes("guzellik") ||
    slug.includes("eticaret")
  ) {
    return "Moda & Stil";
  }

  if (
    /dijital|ajans|yazılım|teknoloji|telefon|bilgisayar/.test(label) ||
    slug.includes("dijital")
  ) {
    return "Teknoloji";
  }

  if (
    /avukat|hukuk|eğitim|kurs|kariyer|iş|meslek|staj|mülakat/.test(label) ||
    slug.includes("egitim") ||
    slug.includes("avukat")
  ) {
    return "Kariyer";
  }

  if (/restoran|kafe|yemek|yaşam|tatil|ev|taşın/.test(label)) {
    return "Yaşam";
  }

  if (/ilişki|flört|sevgili|evlilik/.test(label)) {
    return "İlişkiler";
  }

  if (/oto|galeri|otomotiv|servis|nakliyat|halı/.test(label)) {
    return "Genel";
  }

  return "Genel";
}
