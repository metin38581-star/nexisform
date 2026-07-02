import {
  generateSlug,
  pickRandom,
  randomInt,
  CATEGORIES,
} from "./generators.js";
import {
  generateHumanAnswer,
  generateHumanQuestion,
  llmCooldown,
} from "./openai.js";
import { BotQuestion, BotUser, getBotSupabase } from "./supabase.js";

export interface FullQuestion extends BotQuestion {
  content: string;
  category: string;
  views_count: number;
}

export interface CreatedQuestion extends BotQuestion {
  category: string;
  source: string;
}

export async function createBotQuestion(
  user: BotUser
): Promise<CreatedQuestion> {
  const supabase = getBotSupabase();
  const category = pickRandom(CATEGORIES);

  const generated = await generateHumanQuestion(category, user);
  await llmCooldown();

  const slug = generateSlug(generated.title);

  const { data, error } = await supabase
    .from("forum_questions")
    .insert({
      user_id: user.id,
      title: generated.title,
      slug,
      content: generated.content,
      category,
      views_count: randomIntViews(),
    })
    .select("id, user_id, title, slug")
    .single();

  if (error) {
    if (error.code === "23505") return createBotQuestion(user);
    throw new Error(error.message);
  }

  return {
    ...(data as BotQuestion),
    category,
    source: generated.source,
  };
}

export async function fetchQuestionsByOthers(
  userId: string,
  limit = 30
): Promise<FullQuestion[]> {
  const supabase = getBotSupabase();
  const { data, error } = await supabase
    .from("forum_questions")
    .select("id, user_id, title, slug, content, category, views_count")
    .neq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as FullQuestion[];
}

export async function createBotAnswer(
  question: FullQuestion,
  user: BotUser
): Promise<{ source: string }> {
  const supabase = getBotSupabase();

  const generated = await generateHumanAnswer(
    {
      title: question.title,
      content: question.content,
      category: question.category,
    },
    user
  );
  await llmCooldown();

  const { error } = await supabase.from("forum_answers").insert({
    question_id: question.id,
    user_id: user.id,
    content: generated.content,
    is_best_answer: false,
  });

  if (error) throw new Error(error.message);
  return { source: generated.source };
}

export async function likeQuestion(
  questionId: string,
  user: BotUser
): Promise<boolean> {
  const supabase = getBotSupabase();

  const { data: existing } = await supabase
    .from("forum_question_likes")
    .select("id")
    .eq("question_id", questionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) return false;

  const { error } = await supabase.from("forum_question_likes").insert({
    question_id: questionId,
    user_id: user.id,
  });

  if (error) {
    if (error.code === "23505") return false;
    throw new Error(error.message);
  }

  return true;
}

export function pickQuestionDifferentTopic(
  questions: FullQuestion[],
  ownCategory: string
): FullQuestion | null {
  if (questions.length === 0) return null;

  const different = questions.filter((q) => q.category !== ownCategory);
  return pickRandom(different.length > 0 ? different : questions);
}

function randomIntViews(): number {
  return Math.floor(Math.random() * 40) + 1;
}
