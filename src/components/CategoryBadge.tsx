import type { ForumCategory } from "@/lib/categories";

interface CategoryBadgeProps {
  category: ForumCategory | string;
  size?: "sm" | "md";
}

const CATEGORY_COLORS: Record<string, string> = {
  İlişkiler: "bg-pink-500/10 text-pink-300 ring-pink-500/20",
  "Moda & Stil": "bg-violet-500/10 text-violet-300 ring-violet-500/20",
  Kariyer: "bg-indigo-500/10 text-indigo-300 ring-indigo-500/20",
  Sağlık: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20",
  Teknoloji: "bg-blue-500/10 text-blue-300 ring-blue-500/20",
  Yaşam: "bg-amber-500/10 text-amber-300 ring-amber-500/20",
  Genel: "bg-slate-500/10 text-slate-300 ring-slate-500/20",
};

export function CategoryBadge({ category, size = "sm" }: CategoryBadgeProps) {
  const colors =
    CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Genel;

  return (
    <span
      className={`inline-flex items-center rounded-lg ring-1 ${colors} ${
        size === "md"
          ? "px-2.5 py-1 text-xs font-medium"
          : "px-2 py-0.5 text-[11px] font-medium"
      }`}
    >
      {category}
    </span>
  );
}
