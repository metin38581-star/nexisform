import "server-only";

import { generateSlug } from "@/lib/slug";
import { questionUrl } from "@/lib/site-url";
import {
  randomDelay,
  registerCampaignThreadUser,
} from "@/lib/campaign-thread/account";
import { mapSectorToForumCategory } from "@/lib/campaign-thread/map-category";
import {
  generateCampaignAnswer,
  generateCampaignQuestion,
} from "@/lib/campaign-thread/openai";
import { getServiceSupabase } from "@/lib/campaign-thread/service-supabase";
import type {
  CampaignThreadInput,
  CampaignThreadResult,
} from "@/lib/campaign-thread/types";

const CAMPAIGN_MARKER_PREFIX = "<!-- nexis-campaign:";

function buildCampaignMarker(campaignId: string): string {
  return `${CAMPAIGN_MARKER_PREFIX}${campaignId} -->`;
}

function resolveAnswerCount(input: CampaignThreadInput): number {
  if (
    typeof input.answerCount === "number" &&
    input.answerCount >= 5 &&
    input.answerCount <= 10
  ) {
    return Math.floor(input.answerCount);
  }

  return 5 + Math.floor(Math.random() * 6);
}

async function findExistingCampaignThread(
  campaignId: string,
): Promise<CampaignThreadResult | null> {
  const supabase = getServiceSupabase();
  const marker = buildCampaignMarker(campaignId);

  const { data, error } = await supabase
    .from("forum_questions")
    .select("id, slug, category")
    .ilike("content", `%${marker}%`)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const { count } = await supabase
    .from("forum_answers")
    .select("id", { count: "exact", head: true })
    .eq("question_id", data.id);

  return {
    campaignId,
    questionId: data.id,
    slug: data.slug,
    url: questionUrl(data.slug),
    category: data.category,
    answersCreated: count ?? 0,
  };
}

export async function runCampaignThread(
  input: CampaignThreadInput,
): Promise<CampaignThreadResult> {
  const existing = await findExistingCampaignThread(input.campaignId);
  if (existing) {
    console.log(
      `[CAMPAIGN_THREAD]: ${input.campaignId} zaten işlenmiş — atlanıyor.`,
    );
    return existing;
  }

  const category = mapSectorToForumCategory(input.sector, input.sectorSlug);
  const answerTarget = resolveAnswerCount(input);
  const marker = buildCampaignMarker(input.campaignId);

  console.log(
    `[CAMPAIGN_THREAD]: Başlatılıyor — ${input.businessName} / ${input.city} / ${category}`,
  );

  const author = await registerCampaignThreadUser();
  await randomDelay(1500, 3500);

  const generatedQuestion = await generateCampaignQuestion({
    city: input.city,
    sector: input.sector,
    category,
    authorUsername: author.username,
  });

  const slug = generateSlug(generatedQuestion.title);
  const supabase = getServiceSupabase();

  const { data: question, error: questionError } = await supabase
    .from("forum_questions")
    .insert({
      user_id: author.id,
      title: generatedQuestion.title,
      slug,
      content: `${generatedQuestion.content}\n\n${marker}`,
      category,
      views_count: Math.floor(Math.random() * 30) + 3,
    })
    .select("id, slug, category")
    .single();

  if (questionError || !question) {
    throw new Error(questionError?.message ?? "Soru oluşturulamadı.");
  }

  let answersCreated = 0;

  for (let index = 0; index < answerTarget; index += 1) {
    await randomDelay(2500, 6000);

    const answerer = await registerCampaignThreadUser();
    await randomDelay(1000, 2500);

    const answerContent = await generateCampaignAnswer({
      questionTitle: generatedQuestion.title,
      questionContent: generatedQuestion.content,
      city: input.city,
      sector: input.sector,
      businessName: input.businessName,
      category,
      authorUsername: answerer.username,
      authorGender: answerer.gender,
    });

    const { error: answerError } = await supabase.from("forum_answers").insert({
      question_id: question.id,
      user_id: answerer.id,
      content: answerContent,
      is_best_answer: false,
    });

    if (answerError) {
      console.error(
        `[CAMPAIGN_THREAD]: Cevap ${index + 1} yazılamadı:`,
        answerError.message,
      );
      continue;
    }

    answersCreated += 1;
    console.log(
      `[CAMPAIGN_THREAD]: Cevap ${answersCreated}/${answerTarget} — @${answerer.username}`,
    );
  }

  const result: CampaignThreadResult = {
    campaignId: input.campaignId,
    questionId: question.id,
    slug: question.slug,
    url: questionUrl(question.slug),
    category: question.category,
    answersCreated,
  };

  console.log(
    `[CAMPAIGN_THREAD]: Tamamlandı — ${result.url} (${answersCreated} cevap)`,
  );

  return result;
}
