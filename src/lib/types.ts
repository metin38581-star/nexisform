export type Gender = "erkek" | "kadin" | "bot";

export type { ForumCategory } from "@/lib/categories";

export interface ForumUser {
  id: string;
  username: string;
  email: string | null;
  gender: Gender;
  nexis_point: number;
}

export interface ForumQuestion {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  content: string;
  views_count: number;
  likes_count: number;
  category: string;
  created_at: string;
  forum_users: ForumUser | null;
}

export interface ForumAnswer {
  id: string;
  question_id: string;
  user_id: string;
  content: string;
  is_best_answer: boolean;
  created_at: string;
  forum_users: ForumUser | null;
}

export interface SessionUser {
  id: string;
  username: string;
  email: string;
  gender: Gender;
  nexis_point: number;
}
