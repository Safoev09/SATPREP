"use client";

import { useState } from "react";

type LeaderUser = {
  id: string;
  full_name: string | null;
  username: string | null;
  xp: number;
  current_streak: number;
  longest_streak: number;
};

type Props = {
  topUsers: LeaderUser[];
  currentUserId: string;
  currentUserRank: number;
  currentUserXp: number;
};

const MEDALS = ["🥇", "🥈", "🥉"];

function getLevel(xp: number) {
  return Math.floor(xp / 500) + 1;
}

function getLevelLabel(level: number) {
  if (level >= 20) return "Legend";
  if (level >= 15) return "Master";
  if (level >= 10) return "Expert";
  if (level >= 6) return "Rising";
  return "Starter";
}

function getInitials(name: string | null, username: string | null) {
  if (name) return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  if (username) return username.slice(0, 2).toUpperCase();
  return "??";
}

export default function LeaderboardView({
  topUsers,
  currentUserId,
  currentUserRank,
  currentUserXp,
}: Props) {
  const [filter, setFilter] = useState<"all" | "top10">("all");

  const displayed = filter === "top10" ? topUsers.slice(0, 10) : topUsers;
  const isInTop = topUsers.some((u) => u.id === currentUserId);

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8 animate-fadeup">
        <div className="text-xs text-accent uppercase tracking-[0.15em] font-semibold mb-1">
          Global rankings
        </div>
        <h1 className="font-display text-4xl font-semibold text-coffee-900">
          Leaderboard
        </h1>
        <p className="text-coffee-600 mt-1.5">
          Ranked by XP earned. Keep your streak alive to climb.
        </p>
      </div>

      {/* Your rank card (if not in visible top 50) */}
      {!isInTop && (
        <div className="mb-6 bg-accent/10 border border-accent/25 rounded-2xl p-4 flex items-center justify-between animate-fadeup">
          <div>
            <div className="text-xs text-coffee-600 uppercase tracking-wide font-semibold mb-0.5">Your rank</div>
            <div className="font-display text-2xl font-semibold text-coffee-900">#{currentUserRank}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-coffee-600 mb-0.5">Total XP</div>
            <div className="font-display text-2xl font-semibold text-coffee-900">
              {currentUserXp.toLocaleString()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-coffee-600 mb-0.5">Level</div>
            <div className="font-semibold text-coffee-800">
              {getLevel(currentUserXp)} · {getLevelLabel(getLevel(currentUserXp))}
            </div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {(["all", "top10"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              filter === f
                ? "bg-coffee-800 text-cream-50"
                : "bg-cream-100 text-coffee-700 hover:bg-cream-200 border border-coffee-700/10"
            }`}
          >
            {f === "all" ? "Top 50" : "Top 10"}
          </button>
        ))}
      </div>

      {/* Podium (top 3) */}
      {filter === "all" && topUsers.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[topUsers[1], topUsers[0], topUsers[2]].map((user, podiumIdx) => {
            const realRank = podiumIdx === 0 ? 2 : podiumIdx === 1 ? 1 : 3;
            const isMe = user.id === currentUserId;
            const heights = ["h-24", "h-32", "h-20"];
            return (
              <div
                key={user.id}
                className={`flex flex-col items-center justify-end ${heights[podiumIdx]} rounded-2xl border px-3 py-3 transition ${
                  isMe
                    ? "bg-accent/15 border-accent/30"
                    : "bg-cream-50 border-coffee-700/10"
                }`}
              >
                <div className="text-2xl mb-1">{MEDALS[realRank - 1]}</div>
                <div
                  className={`w-10 h-10 rounded-full grid place-items-center font-display font-semibold text-sm mb-1 ${
                    isMe ? "bg-accent text-cream-50" : "bg-coffee-700 text-cream-50"
                  }`}
                >
                  {getInitials(user.full_name, user.username)}
                </div>
                <div className="text-xs font-semibold text-coffee-900 text-center truncate w-full text-center">
                  {user.full_name?.split(" ")[0] ?? user.username ?? "Student"}
                </div>
                <div className="text-[11px] text-coffee-500">{user.xp.toLocaleString()} XP</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full list */}
      <div className="bg-cream-50 border border-coffee-700/10 rounded-2xl overflow-hidden">
        {displayed.map((user, idx) => {
          const rank = idx + 1;
          const isMe = user.id === currentUserId;
          const level = getLevel(user.xp);

          return (
            <div
              key={user.id}
              className={`flex items-center gap-4 px-5 py-3.5 border-b border-coffee-700/8 last:border-0 transition ${
                isMe ? "bg-accent/8" : "hover:bg-cream-100"
              }`}
            >
              {/* Rank */}
              <div className="w-8 text-center shrink-0">
                {rank <= 3 ? (
                  <span className="text-lg">{MEDALS[rank - 1]}</span>
                ) : (
                  <span className="text-sm font-semibold text-coffee-500">#{rank}</span>
                )}
              </div>

              {/* Avatar */}
              <div
                className={`w-9 h-9 rounded-full grid place-items-center font-display font-semibold text-sm shrink-0 ${
                  isMe ? "bg-accent text-cream-50" : "bg-coffee-700 text-cream-50"
                }`}
              >
                {getInitials(user.full_name, user.username)}
              </div>

              {/* Name + username */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-coffee-900 truncate">
                    {user.full_name ?? user.username ?? "Student"}
                    {isMe && (
                      <span className="ml-1.5 text-[10px] font-medium text-accent">you</span>
                    )}
                  </span>
                </div>
                <div className="text-xs text-coffee-500">
                  {user.username ? `@${user.username}` : ""}
                  {user.username ? " · " : ""}
                  Lv {level} {getLevelLabel(level)}
                </div>
              </div>

              {/* Streak */}
              <div className="text-center shrink-0 hidden sm:block">
                <div className="text-sm font-semibold text-coffee-800">
                  🔥 {user.current_streak}
                </div>
                <div className="text-[10px] text-coffee-500">streak</div>
              </div>

              {/* XP */}
              <div className="text-right shrink-0">
                <div className="text-sm font-semibold text-coffee-900">
                  {user.xp.toLocaleString()}
                </div>
                <div className="text-[10px] text-coffee-500">XP</div>
              </div>
            </div>
          );
        })}

        {displayed.length === 0 && (
          <div className="py-12 text-center text-coffee-500 text-sm">
            No students on the leaderboard yet. Be the first! 🚀
          </div>
        )}
      </div>

      <p className="text-xs text-coffee-400 mt-4 text-center">
        Leaderboard updates in real time · XP is earned by answering questions and maintaining streaks
      </p>
    </div>
  );
}
