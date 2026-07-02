"use client";

import {
  ArrowLeft,
  Award,
  Loader2,
  LogIn,
  MessageCircle,
  Send,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { AuthModal } from "@/components/AuthModal";
import { CategoryBadge } from "@/components/CategoryBadge";
import { QuestionLikeButton } from "@/components/QuestionLikeButton";
import { UserBadge } from "@/components/UserBadge";
import { formatRelativeTime } from "@/lib/format";
import { restoreSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import type { ForumAnswer, ForumQuestion, SessionUser } from "@/lib/types";
import { useIsMounted } from "@/lib/useIsMounted";

interface QuestionDetailClientProps {
  question: ForumQuestion;
  initialAnswers: ForumAnswer[];
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

export function QuestionDetailClient({
  question: initialQuestion,
  initialAnswers,
}: QuestionDetailClientProps) {
  const isMounted = useIsMounted();
  const [question, setQuestion] = useState(initialQuestion);
  const [answers, setAnswers] = useState<ForumAnswer[]>(initialAnswers);
  const [session, setSession] = useState<SessionUser | null>(null);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnswers = useCallback(async () => {
    try {
      const supabase = getSupabase();
      const { data, error: fetchError } = await supabase
        .from("forum_answers")
        .select(
          `
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
        `
        )
        .eq("question_id", question.id)
        .order("created_at", { ascending: true });

      if (fetchError) throw fetchError;
      setAnswers((data ?? []).map(normalizeAnswer));
    } catch (err) {
      console.error("[Nexis Forum] Cevaplar yüklenemedi:", err);
    }
  }, [question.id]);

  useEffect(() => {
    if (!isMounted) return;

    restoreSession().then(setSession);
  }, [isMounted]);

  useEffect(() => {
    if (!isMounted) return;

    const supabase = getSupabase();
    const channel = supabase
      .channel(`answers_${question.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "forum_answers",
          filter: `question_id=eq.${question.id}`,
        },
        () => {
          fetchAnswers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isMounted, question.id, fetchAnswers]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!session) {
      setAuthOpen(true);
      return;
    }

    if (!content.trim()) {
      setError("Cevap boş olamaz.");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = getSupabase();
      const { data, error: insertError } = await supabase
        .from("forum_answers")
        .insert({
          question_id: question.id,
          user_id: session.id,
          content: content.trim(),
          is_best_answer: false,
        })
        .select(
          `
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
        `
        )
        .single();

      if (insertError || !data) {
        throw new Error(insertError?.message ?? "Cevap gönderilemedi.");
      }

      const newAnswer = normalizeAnswer(data);
      setAnswers((prev) => {
        if (prev.some((a) => a.id === newAnswer.id)) return prev;
        return [...prev, newAnswer];
      });
      setContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cevap gönderilemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAuthSuccess = (user: SessionUser) => {
    setSession(user);
  };

  if (!isMounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F19]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19]">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-indigo-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Akışa dön
        </Link>

        <article className="glass-card gradient-border mb-8 rounded-2xl p-6 sm:p-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            {question.forum_users ? (
              <UserBadge
                username={question.forum_users.username}
                gender={question.forum_users.gender}
                nexisPoint={question.forum_users.nexis_point}
              />
            ) : (
              <span className="text-sm text-slate-500">Anonim</span>
            )}
            <span className="text-xs text-slate-500">
              {formatRelativeTime(question.created_at)}
            </span>
          </div>

          <div className="mb-3">
            <CategoryBadge category={question.category} size="md" />
          </div>

          <h1 className="mb-4 text-2xl font-bold leading-tight tracking-tight text-slate-50 sm:text-3xl">
            {question.title}
          </h1>

          <p className="mb-6 whitespace-pre-wrap text-base leading-relaxed text-slate-300">
            {question.content}
          </p>

          <div className="flex flex-wrap items-center gap-4 border-t border-slate-800/60 pt-4">
            <QuestionLikeButton
              questionId={question.id}
              initialLikesCount={question.likes_count}
              session={session}
              onAuthRequired={() => setAuthOpen(true)}
              onCountChange={(count) =>
                setQuestion((prev) => ({ ...prev, likes_count: count }))
              }
              size="md"
            />
            <span className="text-sm text-slate-500">
              {question.views_count} görüntülenme
            </span>
            <span className="inline-flex items-center gap-1 text-sm text-slate-500">
              <MessageCircle className="h-4 w-4" />
              {answers.length} cevap
            </span>
          </div>
        </article>

        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-100">
            Cevaplar
          </h2>

          {answers.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center text-sm text-slate-500">
              Henüz cevap yok. İlk cevabı sen yaz!
            </div>
          ) : (
            <div className="space-y-4">
              {answers.map((answer) => (
                <div
                  key={answer.id}
                  className={`glass-card rounded-2xl p-5 ${
                    answer.is_best_answer
                      ? "ring-1 ring-amber-500/30"
                      : ""
                  }`}
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {answer.forum_users ? (
                        <UserBadge
                          username={answer.forum_users.username}
                          gender={answer.forum_users.gender}
                          nexisPoint={answer.forum_users.nexis_point}
                          compact
                        />
                      ) : (
                        <span className="text-sm text-slate-500">Anonim</span>
                      )}
                      {answer.is_best_answer && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                          <Award className="h-3 w-3" />
                          En İyi Cevap
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">
                      {formatRelativeTime(answer.created_at)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                    {answer.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="glass-card gradient-border rounded-2xl p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-100">
            Cevap Yaz
          </h2>

          {session ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                placeholder="Düşüncelerini paylaş..."
                className="w-full resize-none rounded-xl border border-slate-700/60 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
              />

              {error && (
                <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Cevabı Gönder
              </button>
            </form>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-700/60 bg-slate-900/30 p-6 text-center">
              <LogIn className="mx-auto mb-3 h-8 w-8 text-indigo-400" />
              <p className="mb-4 text-sm text-slate-400">
                Cevap yazmak için giriş yapman gerekiyor.
              </p>
              <button
                type="button"
                onClick={() => setAuthOpen(true)}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
              >
                Giriş Yap / Katıl
              </button>
            </div>
          )}
        </section>
      </div>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
