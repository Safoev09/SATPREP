"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase-client";

// ---- Types ----
type LeaderboardEntry = {
  id: string;
  full_name: string | null;
  username: string | null;
  friend_id: string | null;
  region: string | null;
  current_score: number;
  target_score: number;
  xp: number;
  weekly_xp: number;
  current_streak: number;
  tests_completed: number;
  global_rank: number;
  weekly_rank: number;
};

type Rival = LeaderboardEntry;

type SuggestedRival = {
  rival_id: string;
  full_name: string | null;
  username: string | null;
  friend_id: string | null;
  score: number;
  target_score: number;
  xp: number;
  weekly_xp: number;
  current_streak: number;
  tests_completed: number;
  score_diff: number;
  match_score: number;
};

type Achievement = {
  id: string;
  type: string;
  earned_at: string;
  seen: boolean;
};

type Props = {
  userId: string;
  userName: string;
  userXp: number;
  userWeeklyXp: number;
  userStreak: number;
  userScore: number;
  userTarget: number;
  userRegion: string;
  rivalDisabled: boolean;
  globalLeaderboard: LeaderboardEntry[];
  weeklyLeaderboard: LeaderboardEntry[];
  regionalLeaderboard: LeaderboardEntry[];
  friendsLeaderboard: LeaderboardEntry[];
  rivals: Rival[];
  suggestedRivals: SuggestedRival[];
  achievements: Achievement[];
  myGlobalRank: number | null;
  myWeeklyRank: number | null;
};

type Tab = "rivals" | "weekly" | "global" | "friends" | "regional";

const ACHIEVEMENT_META: Record<string, { icon: string; label: string; color: string }> = {
  beat_rival_xp:        { icon: "⚔️", label: "Beat Rival in XP",        color: "from-yellow-400 to-orange-500" },
  beat_rival_streak:    { icon: "🔥", label: "Outlasted Rival's Streak", color: "from-red-400 to-pink-500" },
  faster_improvement:   { icon: "📈", label: "Improved Faster",          color: "from-green-400 to-emerald-500" },
  leaderboard_top10:    { icon: "🏆", label: "Top 10 Global",            color: "from-purple-400 to-indigo-500" },
};

export default function LeaderboardView({
  userId, userName, userXp, userWeeklyXp, userStreak,
  userScore, userTarget, userRegion, rivalDisabled,
  globalLeaderboard, weeklyLeaderboard, regionalLeaderboard,
  friendsLeaderboard, rivals, suggestedRivals, achievements,
  myGlobalRank, myWeeklyRank,
}: Props) {
  const [tab, setTab] = useState<Tab>("rivals");
  const [isPending, startTransition] = useTransition();
  const [addedRivals, setAddedRivals] = useState<string[]>([]);
  const [rivalModeOff, setRivalModeOff] = useState(rivalDisabled);
  const supabase = createClient();

  const addRival = async (rivalId: string) => {
    await supabase.from("rivals").insert({ user_id: userId, rival_id: rivalId });
    setAddedRivals(prev => [...prev, rivalId]);
  };

  const toggleRivalMode = async () => {
    const newVal = !rivalModeOff;
    await supabase.from("profiles").update({ rival_disabled: newVal }).eq("id", userId);
    setRivalModeOff(newVal);
  };

  const unseenAchievements = achievements.filter(a => !a.seen).length;
  const hasRivals = rivals.length > 0 || suggestedRivals.length > 0;

  return (
    <div className="min-h-screen bg-cream-100">

      {/* ===== HERO ===== */}
      <div className="relative bg-coffee-900 text-cream-50 overflow-hidden">
        {/* Ambient */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-30%] right-[-5%] w-[32rem] h-[32rem] rounded-full bg-accent/20 blur-3xl animate-drift1" />
          <div className="absolute bottom-[-40%] left-[-5%] w-[28rem] h-[28rem] rounded-full bg-coffee-700/60 blur-3xl animate-drift2" />
        </div>

        <div className="relative max-w-5xl mx-auto px-8 pt-10 pb-8">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
            <div>
              <div className="text-accent text-xs font-semibold uppercase tracking-[0.2em] mb-2">
                Rival Arena
              </div>
              <h1 className="font-display text-4xl lg:text-5xl font-semibold leading-tight mb-3">
                Climb. Compete.<br />Conquer.
              </h1>
              <p className="text-cream-200/70 max-w-md leading-relaxed">
                Your rivals are studying right now. Every point you earn moves you up.
                Every day you skip, they close the gap.
              </p>
            </div>

            {/* Your stats card */}
            <div className="bg-cream-50/10 backdrop-blur-sm rounded-3xl p-6 min-w-[240px] border border-cream-50/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-accent/30 border border-accent/40 grid place-items-center font-display font-bold text-lg text-accent">
                  {userName[0]}
                </div>
                <div>
                  <div className="font-semibold text-sm">{userName}</div>
                  <div className="text-xs text-cream-200/50">
                    {myGlobalRank ? `#${myGlobalRank} Global` : "Unranked"}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Total XP", value: userXp.toLocaleString(), icon: "💎" },
                  { label: "Weekly XP", value: userWeeklyXp.toLocaleString(), icon: "⚡" },
                  { label: "Streak", value: `${userStreak}d`, icon: "🔥" },
                  { label: "Score", value: userScore || "—", icon: "📊" },
                ].map(s => (
                  <div key={s.label} className="bg-cream-50/8 rounded-xl p-2.5">
                    <div className="text-base mb-0.5">{s.icon}</div>
                    <div className="font-semibold text-sm">{s.value}</div>
                    <div className="text-[10px] text-cream-200/50">{s.label}</div>
                  </div>
                ))}
              </div>
              {unseenAchievements > 0 && (
                <div className="mt-3 bg-accent/20 border border-accent/30 rounded-xl p-2.5 text-center">
                  <span className="text-xs font-semibold text-accent">
                    🏆 {unseenAchievements} new achievement{unseenAchievements > 1 ? "s" : ""}!
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Weekly rank bar */}
          {myWeeklyRank && (
            <div className="mt-6 bg-cream-50/8 rounded-2xl p-4 flex items-center gap-4">
              <div className="text-2xl">⚡</div>
              <div className="flex-1">
                <div className="flex justify-between text-xs text-cream-200/60 mb-1.5">
                  <span>Weekly rank #{myWeeklyRank}</span>
                  <span>{userWeeklyXp} XP this week</span>
                </div>
                <div className="h-2 bg-cream-50/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent to-yellow-400 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(100, (userWeeklyXp / 500) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="relative border-t border-cream-50/10">
          <div className="max-w-5xl mx-auto px-8 flex gap-0 overflow-x-auto">
            {([
              { id: "rivals", label: "⚔️ Rivals", count: rivals.length },
              { id: "weekly", label: "⚡ This Week" },
              { id: "global", label: "🌍 Global" },
              { id: "friends", label: "👥 Friends", count: friendsLeaderboard.length },
              { id: "regional", label: "📍 Regional" },
            ] as { id: Tab; label: string; count?: number }[]).map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition flex items-center gap-1.5 ${
                  tab === t.id
                    ? "border-accent text-cream-50"
                    : "border-transparent text-cream-200/50 hover:text-cream-200"
                }`}
              >
                {t.label}
                {t.count !== undefined && t.count > 0 && (
                  <span className="text-[10px] bg-accent/30 text-accent px-1.5 py-0.5 rounded-full font-bold">
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="max-w-5xl mx-auto px-8 py-8 space-y-8">

        {/* Achievements strip */}
        {achievements.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {achievements.slice(0, 6).map(a => {
              const meta = ACHIEVEMENT_META[a.type] ?? { icon: "🏅", label: a.type, color: "from-gray-400 to-gray-500" };
              return (
                <div
                  key={a.id}
                  className={`shrink-0 bg-gradient-to-br ${meta.color} rounded-2xl p-3.5 text-white min-w-[130px] ${a.seen ? "opacity-60" : "shadow-lg"}`}
                >
                  <div className="text-2xl mb-1">{meta.icon}</div>
                  <div className="text-xs font-semibold leading-tight">{meta.label}</div>
                  <div className="text-[10px] opacity-70 mt-1">
                    {new Date(a.earned_at).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ---- RIVALS TAB ---- */}
        {tab === "rivals" && (
          <div className="space-y-8">
            {/* Rival mode toggle */}
            <div className="flex items-center justify-between bg-cream-50 border border-coffee-700/10 rounded-2xl p-5">
              <div>
                <div className="font-semibold text-coffee-900">Rival Mode</div>
                <div className="text-sm text-coffee-600">
                  {rivalModeOff ? "Off — you won't appear in others' rival suggestions." : "On — others can match with you as a rival."}
                </div>
              </div>
              <button
                onClick={toggleRivalMode}
                className={`w-12 h-7 rounded-full transition-colors relative ${rivalModeOff ? "bg-coffee-300" : "bg-coffee-800"}`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${rivalModeOff ? "left-1" : "left-6"}`} />
              </button>
            </div>

            {/* Active rivals */}
            {rivals.length > 0 && (
              <div>
                <h2 className="font-display text-xl font-semibold text-coffee-900 mb-4">
                  Your Rivals
                </h2>
                <div className="space-y-4">
                  {rivals.map(rival => (
                    <RivalCard
                      key={rival.id}
                      rival={rival}
                      myXp={userXp}
                      myWeeklyXp={userWeeklyXp}
                      myStreak={userStreak}
                      myScore={userScore}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Suggested rivals */}
            {suggestedRivals.length > 0 && (
              <div>
                <h2 className="font-display text-xl font-semibold text-coffee-900 mb-1">
                  Suggested Rivals
                </h2>
                <p className="text-sm text-coffee-600 mb-4">
                  Matched by score, target, and activity level.
                </p>
                <div className="space-y-4">
                  {suggestedRivals.map(s => (
                    <SuggestedRivalCard
                      key={s.rival_id}
                      rival={s}
                      added={addedRivals.includes(s.rival_id)}
                      onAdd={() => addRival(s.rival_id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {!hasRivals && (
              <EmptyState
                icon="⚔️"
                title="No rivals yet"
                desc="Complete your diagnostic and practice more — we'll match you with students at your exact level."
              />
            )}
          </div>
        )}

        {/* ---- LEADERBOARD TABS ---- */}
        {(tab === "weekly" || tab === "global" || tab === "friends" || tab === "regional") && (
          <LeaderboardTable
            entries={
              tab === "weekly" ? weeklyLeaderboard :
              tab === "global" ? globalLeaderboard :
              tab === "friends" ? friendsLeaderboard :
              regionalLeaderboard
            }
            rankKey={tab === "weekly" ? "weekly_rank" : "global_rank"}
            sortKey={tab === "weekly" ? "weekly_xp" : "xp"}
            userId={userId}
            label={
              tab === "weekly" ? "Weekly XP" :
              tab === "global" ? "Total XP" :
              tab === "friends" ? "XP" : "XP"
            }
            emptyMsg={
              tab === "friends" ? "Add friends to see them here." :
              tab === "regional" ? "No regional data yet." :
              "No data yet."
            }
          />
        )}
      </div>
    </div>
  );
}

// ---- Rival Card ----
function RivalCard({ rival, myXp, myWeeklyXp, myStreak, myScore }: {
  rival: Rival; myXp: number; myWeeklyXp: number; myStreak: number; myScore: number;
}) {
  const xpDiff = myXp - rival.xp;
  const weeklyDiff = myWeeklyXp - rival.weekly_xp;
  const scoreDiff = myScore - rival.current_score;
  const iAhead = xpDiff >= 0;

  return (
    <div className={`rounded-3xl border-2 overflow-hidden ${iAhead ? "border-green-200 bg-green-50/30" : "border-red-200 bg-red-50/20"}`}>
      {/* Header */}
      <div className={`px-6 py-4 flex items-center justify-between ${iAhead ? "bg-green-500/10" : "bg-red-500/10"}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl grid place-items-center font-display font-bold text-lg ${iAhead ? "bg-green-500/20 text-green-800" : "bg-red-500/20 text-red-800"}`}>
            {rival.full_name?.[0] ?? "?"}
          </div>
          <div>
            <div className="font-semibold text-coffee-900">{rival.full_name ?? "Student"}</div>
            {rival.username && <div className="text-xs text-coffee-500">@{rival.username}</div>}
          </div>
        </div>
        <div className={`text-sm font-bold px-3 py-1.5 rounded-full ${iAhead ? "bg-green-500/20 text-green-800" : "bg-red-500/20 text-red-800"}`}>
          {iAhead ? `+${xpDiff} XP ahead` : `${Math.abs(xpDiff)} XP behind`}
        </div>
      </div>

      {/* Stats comparison */}
      <div className="p-5 grid grid-cols-3 gap-4">
        <StatComparison label="XP" mine={myXp} theirs={rival.xp} />
        <StatComparison label="Weekly XP" mine={myWeeklyXp} theirs={rival.weekly_xp} />
        <StatComparison label="Streak" mine={myStreak} theirs={rival.current_streak} suffix="d" />
      </div>

      {/* Score track */}
      <div className="px-5 pb-5">
        <div className="bg-cream-100 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-coffee-600">Score gap</span>
            <span className={`text-xs font-semibold ${scoreDiff >= 0 ? "text-green-700" : "text-red-700"}`}>
              {scoreDiff >= 0 ? `You +${scoreDiff}` : `Behind ${Math.abs(scoreDiff)}`}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="text-center">
              <div className="font-display font-bold text-xl text-coffee-900">{myScore || "—"}</div>
              <div className="text-[10px] text-coffee-500">You</div>
            </div>
            <div className="flex-1 relative h-2 bg-cream-200 rounded-full overflow-hidden">
              <div className="absolute left-0 h-full bg-coffee-800 rounded-full" style={{ width: `${(myScore / 1600) * 100}%` }} />
              <div className="absolute h-full bg-accent/60 rounded-full" style={{ left: `${(rival.current_score / 1600) * 100}%`, width: "2px" }} />
            </div>
            <div className="text-center">
              <div className="font-display font-bold text-xl text-coffee-900">{rival.current_score || "—"}</div>
              <div className="text-[10px] text-coffee-500">{rival.full_name?.split(" ")[0] ?? "Rival"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatComparison({ label, mine, theirs, suffix = "" }: {
  label: string; mine: number; theirs: number; suffix?: string;
}) {
  const ahead = mine >= theirs;
  return (
    <div className="text-center">
      <div className="text-xs text-coffee-500 mb-1.5 uppercase tracking-wide">{label}</div>
      <div className={`font-display text-lg font-semibold ${ahead ? "text-green-700" : "text-red-600"}`}>
        {mine.toLocaleString()}{suffix}
      </div>
      <div className="text-xs text-coffee-500">{theirs.toLocaleString()}{suffix} rival</div>
      <div className={`text-[10px] font-semibold mt-0.5 ${ahead ? "text-green-600" : "text-red-500"}`}>
        {ahead ? "▲" : "▼"} {Math.abs(mine - theirs).toLocaleString()}{suffix}
      </div>
    </div>
  );
}

// ---- Suggested Rival Card ----
function SuggestedRivalCard({ rival, added, onAdd }: {
  rival: SuggestedRival; added: boolean; onAdd: () => void;
}) {
  return (
    <div className="bg-cream-50 border border-coffee-700/10 rounded-2xl p-5 flex items-center gap-5 hover:border-accent/30 transition group">
      <div className="w-11 h-11 rounded-2xl bg-coffee-100 grid place-items-center font-display font-bold text-lg text-coffee-700 shrink-0">
        {rival.full_name?.[0] ?? "?"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-coffee-900">{rival.full_name ?? "Student"}</span>
          <span className="text-xs bg-accent/15 text-accent px-2 py-0.5 rounded-full font-medium">
            {rival.score_diff === 0 ? "Same score" : `${rival.score_diff} pts apart`}
          </span>
        </div>
        {rival.username && <div className="text-xs text-coffee-500">@{rival.username}</div>}
        <div className="flex items-center gap-3 mt-1.5 text-xs text-coffee-600">
          <span>💎 {rival.xp.toLocaleString()} XP</span>
          <span>🔥 {rival.current_streak}d</span>
          <span>📊 {rival.score || "—"}</span>
          <span>→ {rival.target_score}</span>
        </div>
      </div>
      <button
        onClick={onAdd}
        disabled={added}
        className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition ${
          added
            ? "bg-green-100 text-green-700 cursor-default"
            : "bg-coffee-800 text-cream-50 hover:bg-coffee-900"
        }`}
      >
        {added ? "✓ Added" : "Challenge →"}
      </button>
    </div>
  );
}

// ---- Leaderboard Table ----
function LeaderboardTable({ entries, rankKey, sortKey, userId, label, emptyMsg }: {
  entries: LeaderboardEntry[];
  rankKey: "weekly_rank" | "global_rank";
  sortKey: "xp" | "weekly_xp";
  userId: string;
  label: string;
  emptyMsg: string;
}) {
  if (entries.length === 0) {
    return <EmptyState icon="📊" title="Empty leaderboard" desc={emptyMsg} />;
  }

  const sorted = [...entries].sort((a, b) => b[sortKey] - a[sortKey]);

  return (
    <div className="space-y-2">
      {sorted.map((entry, i) => {
        const rank = i + 1;
        const isMe = entry.id === userId;
        const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;

        return (
          <div
            key={entry.id}
            className={`flex items-center gap-4 rounded-2xl px-5 py-4 border transition ${
              isMe
                ? "bg-coffee-800 text-cream-50 border-coffee-700"
                : "bg-cream-50 border-coffee-700/10 hover:border-coffee-700/25"
            }`}
          >
            {/* Rank */}
            <div className={`w-8 text-center font-display font-bold text-lg shrink-0 ${isMe ? "text-accent" : "text-coffee-500"}`}>
              {medal ?? `#${rank}`}
            </div>

            {/* Avatar */}
            <div className={`w-9 h-9 rounded-xl grid place-items-center font-display font-bold shrink-0 ${
              isMe ? "bg-accent/30 text-accent" : "bg-coffee-100 text-coffee-700"
            }`}>
              {entry.full_name?.[0] ?? "?"}
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <div className={`font-semibold truncate ${isMe ? "text-cream-50" : "text-coffee-900"}`}>
                {entry.full_name ?? "Student"}{isMe ? " (You)" : ""}
              </div>
              <div className={`text-xs truncate ${isMe ? "text-cream-200/60" : "text-coffee-500"}`}>
                {entry.username ? `@${entry.username}` : `#${entry.friend_id}`}
                {entry.current_score > 0 && ` · ${entry.current_score} SAT`}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="text-center hidden sm:block">
                <div className={`font-display font-bold text-lg ${isMe ? "text-accent" : "text-coffee-900"}`}>
                  {entry[sortKey].toLocaleString()}
                </div>
                <div className={`text-[10px] ${isMe ? "text-cream-200/50" : "text-coffee-500"}`}>{label}</div>
              </div>
              <div className="text-center hidden md:block">
                <div className={`font-semibold text-sm ${isMe ? "text-cream-200" : "text-coffee-700"}`}>
                  🔥 {entry.current_streak}d
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---- Empty State ----
function EmptyState({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-4">{icon}</div>
      <div className="font-display text-xl font-semibold text-coffee-900 mb-2">{title}</div>
      <p className="text-coffee-600 text-sm max-w-sm mx-auto">{desc}</p>
    </div>
  );
}
