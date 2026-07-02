const TURKISH_MAP: Record<string, string> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  ö: "o",
  ş: "s",
  ü: "u",
  Ç: "c",
  Ğ: "g",
  İ: "i",
  I: "i",
  Ö: "o",
  Ş: "s",
  Ü: "u",
};

export function generateSlug(title: string): string {
  const normalized = title
    .split("")
    .map((char) => TURKISH_MAP[char] ?? char)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);

  const base = normalized || "soru";
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${base}-${suffix}`;
}
