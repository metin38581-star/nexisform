import { after, NextResponse } from "next/server";

import { isInternalRequestAuthorized } from "@/lib/internal-auth";
import { runCampaignThread } from "@/lib/campaign-thread/run-campaign-thread";
import type { CampaignThreadInput } from "@/lib/campaign-thread/types";

export const maxDuration = 300;

function parsePayload(body: unknown): CampaignThreadInput | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const record = body as Record<string, unknown>;
  const campaignId = String(record.campaignId ?? "").trim();
  const businessName = String(record.businessName ?? "").trim();
  const city = String(record.city ?? "").trim();
  const sector = String(record.sector ?? "").trim();

  if (!campaignId || !businessName || !city || !sector) {
    return null;
  }

  const answerCount =
    typeof record.answerCount === "number" ? record.answerCount : undefined;
  const sectorSlug =
    typeof record.sectorSlug === "string" ? record.sectorSlug : undefined;

  return {
    campaignId,
    businessName,
    city,
    sector,
    sectorSlug,
    answerCount,
  };
}

export async function POST(request: Request) {
  if (!isInternalRequestAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON." }, { status: 400 });
  }

  const payload = parsePayload(body);
  if (!payload) {
    return NextResponse.json(
      {
        error:
          "campaignId, businessName, city ve sector alanları zorunludur.",
      },
      { status: 400 },
    );
  }

  after(async () => {
    try {
      await runCampaignThread(payload);
    } catch (error) {
      console.error("[CAMPAIGN_THREAD]: Arka plan hatası:", error);
    }
  });

  return NextResponse.json(
    {
      accepted: true,
      campaignId: payload.campaignId,
      message: "Nexis Forum kampanya konusu kuyruğa alındı.",
    },
    { status: 202 },
  );
}
