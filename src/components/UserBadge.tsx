"use client";

import { Crown, User } from "lucide-react";
import type { Gender } from "@/lib/types";

interface UserBadgeProps {
  username: string;
  gender: Gender;
  nexisPoint?: number;
  compact?: boolean;
}

export function UserBadge({
  username,
  gender,
  nexisPoint = 0,
  compact = false,
}: UserBadgeProps) {
  const isFemale = gender === "kadin";
  const isMale = gender === "erkek";
  const isBot = gender === "bot";

  const iconColor = isFemale
    ? "text-pink-400"
    : isMale
      ? "text-blue-400"
      : "text-slate-400";

  const ringColor = isFemale
    ? "ring-pink-500/30"
    : isMale
      ? "ring-blue-500/30"
      : "ring-slate-500/30";

  return (
    <div className={`flex items-center gap-2 ${compact ? "text-xs" : "text-sm"}`}>
      <div
        className={`flex h-7 w-7 items-center justify-center rounded-full bg-slate-800/80 ring-1 ${ringColor}`}
      >
        <User className={`h-3.5 w-3.5 ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <span className="font-medium text-slate-100">@{username}</span>
        {!compact && (
          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[11px] font-semibold text-indigo-300">
            <Crown className="h-3 w-3" />
            {nexisPoint} NP
          </span>
        )}
      </div>
    </div>
  );
}
