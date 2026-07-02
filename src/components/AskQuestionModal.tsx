"use client";

import { Loader2, Rocket } from "lucide-react";
import { FormEvent, useState } from "react";
import { Modal } from "@/components/Modal";
import {
  DEFAULT_CATEGORY,
  FORUM_CATEGORIES,
  type ForumCategory,
} from "@/lib/categories";
import { generateSlug } from "@/lib/slug";
import { getSupabase } from "@/lib/supabase";
import type { ForumQuestion, SessionUser } from "@/lib/types";

interface AskQuestionModalProps {
  open: boolean;
  onClose: () => void;
  session: SessionUser;
  onQuestionCreated: (question: ForumQuestion) => void;
}

export function AskQuestionModal({
  open,
  onClose,
  session,
  onQuestionCreated,
}: AskQuestionModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<ForumCategory>(DEFAULT_CATEGORY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !content.trim()) {
      setError("Başlık ve içerik zorunludur.");
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabase();
      const slug = generateSlug(title);

      const { data, error: insertError } = await supabase
        .from("forum_questions")
        .insert({
          user_id: session.id,
          title: title.trim(),
          slug,
          content: content.trim(),
          category,
          views_count: 0,
        })
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
        .single();

      if (insertError || !data) {
        throw new Error(insertError?.message ?? "Soru gönderilemedi.");
      }

      const question: ForumQuestion = {
        ...data,
        likes_count: (data.likes_count as number) ?? 0,
        category: (data.category as string) ?? category,
        forum_users: Array.isArray(data.forum_users)
          ? data.forum_users[0] ?? null
          : data.forum_users,
      };

      onQuestionCreated(question);
      setTitle("");
      setContent("");
      setCategory(DEFAULT_CATEGORY);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Soru gönderilemedi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Soru Sor" wide>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="question-title"
            className="mb-1.5 block text-sm font-medium text-slate-300"
          >
            Başlık
          </label>
          <input
            id="question-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ne sormak istiyorsun?"
            className="w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium text-slate-300">
            Kategori
          </span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {FORUM_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`rounded-xl border px-3 py-2.5 text-xs font-medium transition sm:text-sm ${
                  category === cat
                    ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-200"
                    : "border-slate-700/60 bg-slate-900/40 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="question-content"
            className="mb-1.5 block text-sm font-medium text-slate-300"
          >
            Detay
          </label>
          <textarea
            id="question-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            placeholder="Durumu biraz daha anlat..."
            className="w-full resize-none rounded-xl border border-slate-700/60 bg-slate-900/60 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition hover:from-indigo-500 hover:via-violet-500 hover:to-indigo-500 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Rocket className="h-4 w-4" />
          )}
          Soruyu Fırlat
        </button>
      </form>
    </Modal>
  );
}
