import {
  generateEmail,
  generateSlug,
  generateUsername,
  pickRandom,
  randomNexisPoint,
  CATEGORIES,
} from "./generators.js";
import {
  geminiCooldown,
  generateHumanAnswer,
  generateHumanQuestion,
} from "./gemini.js";
import { BotQuestion, BotUser, getBotSupabase } from "./supabase.js";

export interface FullQuestion extends BotQuestion {
  content: string;
  category: string;
  views_count: number;
}

export async function fetchRandomUsers(limit = 20): Promise<BotUser[]> {
  const supabase = getBotSupabase();
  const { data, error } = await supabase
    .from("forum_users")
    .select("id, username, gender")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as BotUser[];
}

export async function createBotUser(): Promise<BotUser> {
  const supabase = getBotSupabase();
  const { username, gender } = generateUsername();
  const email = generateEmail(username);

  const { data, error } = await supabase
    .from("forum_users")
    .insert({
      username,
      email,
      gender,
      nexis_point: randomNexisPoint(),
    })
    .select("id, username, gender")
    .single();

  if (error) {
    if (error.code === "23505") return createBotUser();
    throw new Error(error.message);
  }

  return data as BotUser;
}

export async function createBotQuestion(
  user: BotUser
): Promise<BotQuestion & { source: string }> {
  const supabase = getBotSupabase();
  const category = pickRandom(CATEGORIES);

  const generated = await generateHumanQuestion(category, user);
  await geminiCooldown();

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

  return { ...(data as BotQuestion), source: generated.source };
}

export async function fetchRecentQuestions(limit = 15): Promise<FullQuestion[]> {
  const supabase = getBotSupabase();
  const { data, error } = await supabase
    .from("forum_questions")
    .select("id, user_id, title, slug, content, category, views_count")
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
  await geminiCooldown();

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

export async function bumpViews(questionId: string, current: number): Promise<void> {
  const supabase = getBotSupabase();
  await supabase
    .from("forum_questions")
    .update({ views_count: current + randomIntViews() })
    .eq("id", questionId);
}

function randomIntViews(): number {
  return Math.floor(Math.random() * 40) + 1;
}

export async function pickAnswerer(
  questionAuthorId: string,
  users: BotUser[]
): Promise<BotUser | null> {
  const candidates = users.filter((u) => u.id !== questionAuthorId);
  if (candidates.length === 0) {
    const fresh = await createBotUser();
    return fresh.id === questionAuthorId ? null : fresh;
  }
  return pickRandom(candidates);
}

export async function pickLiker(
  excludeIds: string[],
  users: BotUser[]
): Promise<BotUser> {
  const candidates = users.filter((u) => !excludeIds.includes(u.id));
  if (candidates.length === 0) return createBotUser();
  return pickRandom(candidates);
}

export async function ensureUserPool(min = 8): Promise<BotUser[]> {
  let users = await fetchRandomUsers(50);
  while (users.length < min) {
    const created = await createBotUser();
    users = [created, ...users];
  }
  return users;
}
