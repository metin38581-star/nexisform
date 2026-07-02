import { getSupabase } from "@/lib/supabase";

export async function checkUserLiked(
  questionId: string,
  userId: string
): Promise<boolean> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("forum_question_likes")
    .select("id")
    .eq("question_id", questionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return false;
  return !!data;
}

export async function toggleQuestionLike(
  questionId: string,
  userId: string,
  currentlyLiked: boolean
): Promise<void> {
  const supabase = getSupabase();

  if (currentlyLiked) {
    const { error } = await supabase
      .from("forum_question_likes")
      .delete()
      .eq("question_id", questionId)
      .eq("user_id", userId);

    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabase.from("forum_question_likes").insert({
    question_id: questionId,
    user_id: userId,
  });

  if (error) throw new Error(error.message);
}
