import "server-only";

export function resolveInternalSecret(): string | undefined {
  return (
    process.env.NEXIS_FORUM_INTERNAL_SECRET?.trim() ||
    process.env.CAMPAIGN_THREAD_SECRET?.trim()
  );
}

export function isInternalRequestAuthorized(request: Request): boolean {
  const secret = resolveInternalSecret();
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}
