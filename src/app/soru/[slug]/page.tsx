import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { QuestionDetailClient } from "@/components/QuestionDetailClient";
import { getSupabase } from "@/lib/supabase";
import type { ForumAnswer, ForumQuestion } from "@/lib/types";

export const revalidate = 0;
export const dynamic = "force-dynamic";

const QUESTION_SELECT = `
  id,
  user_id,
  title,
  slug,
  content,
  category,
  views_count,
  likes_count,
  created_at,
  forum_users (
    id,
    username,
    email,
    gender,
    nexis_point
  )
`;

const ANSWER_SELECT = `
  id,
  question_id,
  user_id,
  content,
  is_best_answer,
  created_at,
  forum_users (
    id,
    username,
    email,
    gender,
    nexis_point
  )
`;

function normalizeQuestion(row: Record<string, unknown>): ForumQuestion {
  const users = row.forum_users;
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    title: row.title as string,
    slug: row.slug as string,
    content: row.content as string,
    views_count: (row.views_count as number) ?? 0,
    likes_count: (row.likes_count as number) ?? 0,
    category: (row.category as string) ?? "Genel",
    created_at: row.created_at as string,
    forum_users: Array.isArray(users)
      ? (users[0] as ForumQuestion["forum_users"])
      : (users as ForumQuestion["forum_users"]),
  };
}

function normalizeAnswer(row: Record<string, unknown>): ForumAnswer {
  const users = row.forum_users;
  return {
    id: row.id as string,
    question_id: row.question_id as string,
    user_id: row.user_id as string,
    content: row.content as string,
    is_best_answer: (row.is_best_answer as boolean) ?? false,
    created_at: row.created_at as string,
    forum_users: Array.isArray(users)
      ? (users[0] as ForumAnswer["forum_users"])
      : (users as ForumAnswer["forum_users"]),
  };
}

async function getQuestion(slug: string): Promise<ForumQuestion | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("forum_questions")
    .select(QUESTION_SELECT)
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  return normalizeQuestion(data);
}

async function getAnswers(questionId: string): Promise<ForumAnswer[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("forum_answers")
    .select(ANSWER_SELECT)
    .eq("question_id", questionId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data.map((row) => normalizeAnswer(row));
}

async function incrementViews(questionId: string, currentCount: number) {
  const supabase = getSupabase();
  await supabase
    .from("forum_questions")
    .update({ views_count: currentCount + 1 })
    .eq("id", questionId);
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const question = await getQuestion(slug);

  if (!question) {
    return { title: "Soru Bulunamadı | Nexis Forum" };
  }

  return {
    title: `${question.title} | Nexis Forum`,
    description: question.content.slice(0, 160),
    openGraph: {
      title: question.title,
      description: question.content.slice(0, 160),
      type: "article",
    },
  };
}

export default async function QuestionPage({ params }: PageProps) {
  const { slug } = await params;
  const question = await getQuestion(slug);

  if (!question) {
    notFound();
  }

  await incrementViews(question.id, question.views_count);

  const answers = await getAnswers(question.id);
  const questionWithView = {
    ...question,
    views_count: question.views_count + 1,
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    headline: question.title,
    text: question.content,
    datePublished: question.created_at,
    author: question.forum_users
      ? {
          "@type": "Person",
          name: question.forum_users.username,
        }
      : undefined,
    interactionStatistic: {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/ViewAction",
      userInteractionCount: questionWithView.views_count,
    },
    comment: answers.map((answer) => ({
      "@type": "Comment",
      text: answer.content,
      datePublished: answer.created_at,
      author: answer.forum_users
        ? {
            "@type": "Person",
            name: answer.forum_users.username,
          }
        : undefined,
    })),
  };

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
