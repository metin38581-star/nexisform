import { getSupabase } from "@/lib/supabase";
import type { ForumAnswer, ForumQuestion } from "@/lib/types";

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

export function normalizeQuestion(row: Record<string, unknown>): ForumQuestion {
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

export function normalizeAnswer(row: Record<string, unknown>): ForumAnswer {
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

export async function fetchRecentQuestions(
  limit = 50
): Promise<ForumQuestion[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("forum_questions")
    .select(QUESTION_SELECT)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[Nexis Forum] fetchRecentQuestions:", error.message);
    return [];
  }

  return (data ?? []).map((row) =>
    normalizeQuestion(row as Record<string, unknown>)
  );
}

export async function fetchQuestionBySlug(
  slug: string
): Promise<ForumQuestion | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("forum_questions")
    .select(QUESTION_SELECT)
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  return normalizeQuestion(data as Record<string, unknown>);
}

export async function fetchAnswersForQuestion(
  questionId: string
): Promise<ForumAnswer[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("forum_answers")
    .select(ANSWER_SELECT)
    .eq("question_id", questionId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data.map((row) =>
    normalizeAnswer(row as Record<string, unknown>)
  );
}

export async function incrementQuestionViews(
  questionId: string,
  currentCount: number
): Promise<void> {
  const supabase = getSupabase();
  await supabase
    .from("forum_questions")
    .update({ views_count: currentCount + 1 })
    .eq("id", questionId);
}
