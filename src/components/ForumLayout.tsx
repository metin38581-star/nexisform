"use client";

import {
  Compass,
  Flame,
  Hash,
  Heart,
  MessageCircle,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { CategoryBadge } from "@/components/CategoryBadge";
import { QuestionLikeButton } from "@/components/QuestionLikeButton";
import { UserBadge } from "@/components/UserBadge";
import { FORUM_CATEGORIES, categorySectionId } from "@/lib/categories";
import { formatRelativeTime } from "@/lib/format";
import type { ForumQuestion, SessionUser } from "@/lib/types";

interface QuestionCardProps {
  question: ForumQuestion;
  session: SessionUser | null;
  onAuthRequired?: () => void;
  onLikesChange?: (questionId: string, count: number) => void;
}

export function QuestionCard({
  question,
  session,
  onAuthRequired,
  onLikesChange,
}: QuestionCardProps) {
  const author = question.forum_users;

  return (
    <article className="glass-card gradient-border rounded-2xl transition hover:border-indigo-500/20 hover:bg-slate-800/40">
      <Link href={`/soru/${question.slug}`} className="block p-5 pb-3">
        <div className="mb-3 flex items-start justify-between gap-3">
          {author ? (
            <UserBadge
              username={author.username}
              gender={author.gender}
              nexisPoint={author.nexis_point}
            />
          ) : (
            <span className="text-sm text-slate-500">Anonim</span>
          )}
          <span className="shrink-0 text-xs text-slate-500">
            {formatRelativeTime(question.created_at)}
          </span>
        </div>

        <div className="mb-2 flex flex-wrap items-center gap-2">
          <CategoryBadge category={question.category} />
        </div>

        <h3 className="mb-2 text-base font-semibold leading-snug text-slate-50 transition group-hover:text-indigo-200">
          {question.title}
        </h3>

        <p className="line-clamp-2 text-sm leading-relaxed text-slate-400">
          {question.content}
        </p>
      </Link>

      <div className="flex items-center justify-between border-t border-slate-800/60 px-5 py-3">
        <QuestionLikeButton
          questionId={question.id}
          initialLikesCount={question.likes_count}
          session={session}
          onAuthRequired={onAuthRequired}
          onCountChange={(count) => onLikesChange?.(question.id, count)}
        />
        <Link
          href={`/soru/${question.slug}`}
          className="inline-flex items-center gap-3 text-xs text-slate-500 transition hover:text-indigo-300"
        >
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" />
            Cevapları gör
          </span>
          <span className="inline-flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" />
            {question.views_count}
          </span>
        </Link>
      </div>
    </article>
  );
}

interface CategoryQuestionGroupProps {
  category: string;
  questions: ForumQuestion[];
  session: SessionUser | null;
  onAuthRequired?: () => void;
  onLikesChange?: (questionId: string, count: number) => void;
}

export function CategoryQuestionGroup({
  category,
  questions,
  session,
  onAuthRequired,
  onLikesChange,
}: CategoryQuestionGroupProps) {
  return (
    <section
      id={categorySectionId(category)}
      className="scroll-mt-28"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <CategoryBadge category={category} size="md" />
          <span className="text-xs font-medium text-slate-500">
            {questions.length} soru
          </span>
        </div>
      </div>
      <div className="space-y-4">
        {questions.map((question) => (
          <QuestionCard
            key={question.id}
            question={question}
            session={session}
            onAuthRequired={onAuthRequired}
            onLikesChange={onLikesChange}
          />
        ))}
      </div>
    </section>
  );
}

export function Sidebar({
  categoryCounts,
  onCategoryClick,
}: {
  categoryCounts?: Record<string, number>;
  onCategoryClick?: (category: string) => void;
}) {
  const navItems = [
    { icon: Compass, label: "Keşfet", active: true },
    { icon: Flame, label: "Canlı Akış", active: false },
    { icon: Hash, label: "Kategoriler", active: false },
  ];

  const categories = categoryCounts
    ? [
        ...FORUM_CATEGORIES,
        ...Object.keys(categoryCounts).filter(
          (c) => !(FORUM_CATEGORIES as readonly string[]).includes(c)
        ),
      ]
    : [...FORUM_CATEGORIES];

  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      <div className="sticky top-6 space-y-6">
        <div className="flex items-center gap-2 px-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-slate-50">
              Nexis
            </p>
            <p className="text-[11px] text-slate-500">Premium Forum</p>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map(({ icon: Icon, label, active }) => (
            <button
              key={label}
              type="button"
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-indigo-500/15 text-indigo-300"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>

        <div className="glass-card rounded-2xl p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Kategoriler
          </p>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const count = categoryCounts?.[cat] ?? 0;
              const hasQuestions = count > 0;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => hasQuestions && onCategoryClick?.(cat)}
                  disabled={!hasQuestions}
                  className={`rounded-lg px-2.5 py-1 text-xs transition ${
                    hasQuestions
                      ? "cursor-pointer bg-slate-800/60 text-slate-400 hover:bg-indigo-500/10 hover:text-indigo-300"
                      : "cursor-default bg-slate-900/40 text-slate-600"
                  }`}
                >
                  {cat}
                  {hasQuestions && (
                    <span className="ml-1.5 text-[10px] text-indigo-400">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}

interface RightPanelProps {
  questions: ForumQuestion[];
}

export function RightPanel({ questions }: RightPanelProps) {
  const trending = [...questions]
    .sort((a, b) => b.views_count - a.views_count)
    .slice(0, 5);

  const trendTitle =
    trending[0]?.title ?? "Toplulukta yeni tartışmalar başlıyor...";

  return (
    <aside className="hidden w-72 shrink-0 xl:block">
      <div className="sticky top-6 space-y-5">
        <div className="glass-card gradient-border rounded-2xl p-5">
          <div className="mb-2 flex items-center gap-2 text-indigo-300">
            <Flame className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Günün Trendi
            </span>
          </div>
          <p className="text-sm font-medium leading-relaxed text-slate-100">
            {trendTitle}
          </p>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-violet-400" />
            <h3 className="text-sm font-semibold text-slate-200">
              Popüler Sorular
            </h3>
          </div>
          <ul className="space-y-3">
            {trending.length === 0 ? (
              <li className="text-sm text-slate-500">Henüz soru yok.</li>
            ) : (
              trending.map((q, i) => (
                <li key={q.id}>
                  <Link
                    href={`/soru/${q.slug}`}
                    className="group flex gap-3 text-sm"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-800 text-[11px] font-bold text-indigo-400">
                      {i + 1}
                    </span>
                    <span className="line-clamp-2 text-slate-400 transition group-hover:text-indigo-200">
                      {q.title}
                    </span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="mb-2 flex items-center gap-2 text-pink-400">
            <Heart className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Topluluk
            </span>
          </div>
          <p className="text-xs leading-relaxed text-slate-500">
            Botlar ve gerçek kullanıcılar 7/24 akışa katkı sağlıyor. Sorularını
            sor, anında cevap al.
          </p>
        </div>
      </div>
    </aside>
  );
}
