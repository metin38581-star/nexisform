"use client";

import {
  Loader2,
  LogOut,
  MessageSquarePlus,
  RefreshCw,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AskQuestionModal } from "@/components/AskQuestionModal";
import { AuthModal } from "@/components/AuthModal";
import {
  QuestionCard,
  RightPanel,
  Sidebar,
} from "@/components/ForumLayout";
import { UserBadge } from "@/components/UserBadge";
import { logout, restoreSession } from "@/lib/auth";
import { normalizeQuestion } from "@/lib/forum-queries";
import { getSupabase } from "@/lib/supabase";
import type { ForumQuestion, SessionUser } from "@/lib/types";
import { useIsMounted } from "@/lib/useIsMounted";

interface HomePageClientProps {
  initialQuestions: ForumQuestion[];
}

export function HomePageClient({ initialQuestions }: HomePageClientProps) {
  const isMounted = useIsMounted();
  const [session, setSession] = useState<SessionUser | null>(null);
  const [questions, setQuestions] = useState<ForumQuestion[]>(initialQuestions);
  const [loading, setLoading] = useState(initialQuestions.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [pendingAsk, setPendingAsk] = useState(false);

  const fetchQuestions = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("forum_questions")
        .select(
          `
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
        `
        )
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setQuestions(
        (data ?? []).map((row) =>
          normalizeQuestion(row as Record<string, unknown>)
        )
      );
    } catch (err) {
      console.error("[Nexis Forum] Sorular yüklenemedi:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    restoreSession().then(setSession);
    fetchQuestions(initialQuestions.length > 0);
  }, [isMounted, fetchQuestions, initialQuestions.length]);

  useEffect(() => {
    if (!isMounted) return;

    const supabase = getSupabase();
    const channel = supabase
      .channel("home_forum_questions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "forum_questions" },
        () => {
          fetchQuestions(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isMounted, fetchQuestions]);

  const handleAuthSuccess = async (user: SessionUser) => {
    setSession(user);
    if (pendingAsk) {
      setPendingAsk(false);
      setAskOpen(true);
    }
  };

  const handleLogout = async () => {
    await logout();
    setSession(null);
  };

  const handleLikesChange = (questionId: string, count: number) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId ? { ...q, likes_count: count } : q
      )
    );
  };

  const handleAskClick = () => {
    if (!session) {
      setPendingAsk(true);
      setAuthOpen(true);
      return;
    }
    setAskOpen(true);
  };

  const handleQuestionCreated = (question: ForumQuestion) => {
    setQuestions((prev) => {
      if (prev.some((q) => q.id === question.id)) return prev;
      return [question, ...prev];
    });
  };

  const sortedQuestions = useMemo(
    () =>
      [...questions].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [questions]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const q of questions) {
      const cat = q.category?.trim() || "Genel";
      counts[cat] = (counts[cat] ?? 0) + 1;
    }
    return counts;
  }, [questions]);

  if (!isMounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F19]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#0B0F19]">
        <header className="sticky top-0 z-40 border-b border-slate-800/60 bg-[#0B0F19]/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-slate-50">Nexis</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fetchQuestions(true)}
                disabled={refreshing}
                className="hidden rounded-xl border border-slate-700/60 p-2 text-slate-400 transition hover:border-slate-600 hover:text-slate-200 sm:flex"
                title="Yenile"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
              </button>

              {session ? (
                <div className="flex items-center gap-2">
                  <div className="glass-card hidden rounded-xl px-3 py-2 sm:block">
                    <UserBadge
                      username={session.username}
                      gender={session.gender}
                      nexisPoint={session.nexis_point}
                      compact
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-700/60 px-3 py-2 text-xs font-medium text-slate-400 transition hover:border-red-500/30 hover:text-red-300"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Çıkış</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700/60 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-indigo-500/40 hover:text-indigo-200"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Giriş Yap / Katıl
                </button>
              )}

              <button
                type="button"
                onClick={handleAskClick}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-900/30 transition hover:from-indigo-500 hover:to-violet-500"
              >
                <MessageSquarePlus className="h-3.5 w-3.5" />
                Soru Sor
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
          <Sidebar categoryCounts={categoryCounts} />

          <main className="min-w-0 flex-1">
            <div className="mb-6">
              <h1 className="text-xl font-bold tracking-tight text-slate-50 sm:text-2xl">
                Canlı Akış
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                En yeni yayınlanan içerikler üstte — anlık güncellenir.
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
              </div>
            ) : questions.length === 0 ? (
              <div className="glass-card rounded-2xl p-10 text-center">
                <p className="text-slate-400">
                  Henüz soru yok. İlk soruyu sen sor!
                </p>
                <button
                  type="button"
                  onClick={handleAskClick}
                  className="mt-4 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
                >
                  Soru Sor
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedQuestions.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    session={session}
                    onAuthRequired={() => setAuthOpen(true)}
                    onLikesChange={handleLikesChange}
                  />
                ))}
              </div>
            )}
          </main>

          <RightPanel questions={questions} />
        </div>
      </div>

      <AuthModal
        open={authOpen}
        onClose={() => {
          setAuthOpen(false);
          setPendingAsk(false);
        }}
        onSuccess={handleAuthSuccess}
      />

      {session && (
        <AskQuestionModal
          open={askOpen}
          onClose={() => setAskOpen(false)}
          session={session}
          onQuestionCreated={handleQuestionCreated}
        />
      )}
    </>
  );
}
