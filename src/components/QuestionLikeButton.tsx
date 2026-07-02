"use client";

import { Heart, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { checkUserLiked, toggleQuestionLike } from "@/lib/likes";
import type { SessionUser } from "@/lib/types";
import { useIsMounted } from "@/lib/useIsMounted";

interface QuestionLikeButtonProps {
  questionId: string;
  initialLikesCount: number;
  session: SessionUser | null;
  onAuthRequired?: () => void;
  onCountChange?: (count: number) => void;
  size?: "sm" | "md";
}

export function QuestionLikeButton({
  questionId,
  initialLikesCount,
  session,
  onAuthRequired,
  onCountChange,
  size = "sm",
}: QuestionLikeButtonProps) {
  const isMounted = useIsMounted();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialLikesCount);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    setCount(initialLikesCount);
  }, [initialLikesCount]);

  useEffect(() => {
    if (!isMounted || !session) {
      setLiked(false);
      return;
    }

    let cancelled = false;
    setChecking(true);

    checkUserLiked(questionId, session.id)
      .then((result) => {
        if (!cancelled) setLiked(result);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isMounted, session, questionId]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session) {
      onAuthRequired?.();
      return;
    }

    if (loading) return;

    const nextLiked = !liked;
    const nextCount = nextLiked ? count + 1 : Math.max(count - 1, 0);

    setLiked(nextLiked);
    setCount(nextCount);
    onCountChange?.(nextCount);
    setLoading(true);

    try {
      await toggleQuestionLike(questionId, session.id, liked);
    } catch {
      setLiked(liked);
      setCount(count);
      onCountChange?.(count);
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-slate-500 ${size === "md" ? "text-sm" : "text-xs"}`}
      >
        <Heart className={size === "md" ? "h-5 w-5" : "h-4 w-4"} />
        {initialLikesCount}
      </span>
    );
  }

  const iconSize = size === "md" ? "h-5 w-5" : "h-4 w-4";
  const textSize = size === "md" ? "text-sm" : "text-xs";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading || checking}
      className={`group/like inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 transition ${textSize} ${
        liked
          ? "bg-pink-500/10 text-pink-400 hover:bg-pink-500/15"
          : "text-slate-500 hover:bg-slate-800/60 hover:text-pink-400"
      }`}
      aria-label={liked ? "Beğeniyi kaldır" : "Beğen"}
    >
      {loading ? (
        <Loader2 className={`${iconSize} animate-spin`} />
      ) : (
        <Heart
          className={`${iconSize} transition group-hover/like:scale-110 ${
            liked ? "fill-pink-500 text-pink-500" : ""
          }`}
        />
      )}
      <span className={`font-medium ${liked ? "text-pink-300" : ""}`}>
        {count}
      </span>
    </button>
  );
}
