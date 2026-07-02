import type { ForumQuestion } from "@/lib/types";

export const FORUM_CATEGORIES = [
  "İlişkiler",
  "Moda & Stil",
  "Kariyer",
  "Sağlık",
  "Teknoloji",
  "Yaşam",
  "Genel",
] as const;

export type ForumCategory = (typeof FORUM_CATEGORIES)[number];

export const DEFAULT_CATEGORY: ForumCategory = "İlişkiler";

export function isForumCategory(value: string): value is ForumCategory {
  return (FORUM_CATEGORIES as readonly string[]).includes(value);
}

export function categorySectionId(category: string): string {
  return `category-${category.replace(/&/g, "ve").replace(/\s+/g, "-").toLowerCase()}`;
}

export interface CategoryGroup {
  category: string;
  questions: ForumQuestion[];
}

export function groupQuestionsByCategory(
  questions: ForumQuestion[]
): CategoryGroup[] {
  const map = new Map<string, ForumQuestion[]>();

  for (const question of questions) {
    const category = question.category?.trim() || "Genel";
    const list = map.get(category) ?? [];
    list.push(question);
    map.set(category, list);
  }

  const groups: CategoryGroup[] = [];
  const ordered = [...FORUM_CATEGORIES];

  for (const category of ordered) {
    const items = map.get(category);
    if (items?.length) {
      groups.push({ category, questions: items });
      map.delete(category);
    }
  }

  for (const [category, items] of map.entries()) {
    if (items.length) groups.push({ category, questions: items });
  }

  return groups;
}

