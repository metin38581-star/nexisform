import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { QuestionDetailClient } from "@/components/QuestionDetailClient";
import {
  fetchAnswersForQuestion,
  fetchQuestionBySlug,
  incrementQuestionViews,
} from "@/lib/forum-queries";
import { buildDiscussionForumPostingJsonLd } from "@/lib/json-ld";
import { questionUrl } from "@/lib/site-url";

export const revalidate = 0;
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const question = await fetchQuestionBySlug(slug);

  if (!question) {
    return { title: "Soru Bulunamadı | Nexis Forum" };
  }

  const description = question.content.slice(0, 160);
  const url = questionUrl(slug);

  return {
    title: `${question.title} | Nexis Forum`,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: question.title,
      description,
      type: "article",
      url,
      siteName: "Nexis Forum",
      locale: "tr_TR",
      publishedTime: question.created_at,
    },
  };
}

export default async function QuestionPage({ params }: PageProps) {
  const { slug } = await params;
  const question = await fetchQuestionBySlug(slug);

  if (!question) {
    notFound();
  }

  await incrementQuestionViews(question.id, question.views_count);

  const answers = await fetchAnswersForQuestion(question.id);
  const questionWithView = {
    ...question,
    views_count: question.views_count + 1,
  };

  const jsonLd = buildDiscussionForumPostingJsonLd(questionWithView, {
    answers,
    viewsCount: questionWithView.views_count,
  });

  return (
    <>
      <JsonLd data={jsonLd} />
      <QuestionDetailClient
        question={questionWithView}
        initialAnswers={answers}
      />
    </>
  );
}
