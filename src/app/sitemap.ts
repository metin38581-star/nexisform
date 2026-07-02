import type { MetadataRoute } from "next";
import { getSiteUrl, questionUrl } from "@/lib/site-url";
import { getSupabase } from "@/lib/supabase";

export const revalidate = 0;

interface QuestionSitemapRow {
  slug: string;
  created_at: string;
}

async function fetchAllQuestions(): Promise<QuestionSitemapRow[]> {
  const supabase = getSupabase();
  const pageSize = 1000;
  const rows: QuestionSitemapRow[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("forum_questions")
      .select("slug, created_at")
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) {
      throw new Error(`[sitemap] forum_questions fetch failed: ${error.message}`);
    }

    if (!data?.length) break;

    rows.push(...(data as QuestionSitemapRow[]));

    if (data.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  const homeEntry: MetadataRoute.Sitemap[number] = {
    url: siteUrl,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1.0,
  };

  try {
    const questions = await fetchAllQuestions();

    const questionEntries: MetadataRoute.Sitemap = questions.map((question) => ({
      url: questionUrl(question.slug),
      lastModified: new Date(question.created_at),
      changeFrequency: "daily",
      priority: 0.8,
    }));

    return [homeEntry, ...questionEntries];
  } catch (err) {
    console.error("[sitemap] Supabase error, returning homepage only:", err);
    return [homeEntry];
  }
}
