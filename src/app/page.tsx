import { HomePageClient } from "@/components/HomePageClient";
import { JsonLd } from "@/components/JsonLd";
import { fetchRecentQuestions } from "@/lib/forum-queries";
import { buildHomeJsonLd } from "@/lib/json-ld";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const questions = await fetchRecentQuestions(50);
  const jsonLd = buildHomeJsonLd(questions);

  return (
    <>
      <JsonLd data={jsonLd} />
      <HomePageClient initialQuestions={questions} />
    </>
  );
}
