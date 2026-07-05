/**
 * Yerel kampanya thread testi
 * node --env-file=.env.local --import tsx scripts/test-campaign-thread.mts
 */
process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";

const { runCampaignThread } = await import(
  "../src/lib/campaign-thread/run-campaign-thread"
);

const result = await runCampaignThread({
  campaignId: `test-${Date.now()}`,
  businessName: "Demo Kuaför Salonu",
  city: "İstanbul",
  sector: "Kuaför",
  answerCount: 5,
});

console.log(JSON.stringify(result, null, 2));
