export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return url.replace(/\/$/, "");
}

export function questionUrl(slug: string): string {
  return `${getSiteUrl()}/soru/${slug}`;
}
