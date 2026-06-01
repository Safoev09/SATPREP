"use client";

import Link from "next/link";
import { useState } from "react";
import ConstellationMap from "@/components/ConstellationMap";
import EtymologyPanel from "@/components/EtymologyPanel";

type UserWord = {
  id: number;
  word: string;
  definition: string | null;
  example: string | null;
  mastery_state: "new" | "learning" | "due" | "mastered" | null;
  box: number;
  source_list_id: number | null;
  source_type: string | null;
};

type VocabList = { id: number; title: string; description: string | null };

export default function VocabularyDashboard({
  userId,
  routeWords,
  clearedIds,
  counts,
  totalWords,
  mistakesCount,
  lists,
  focusWord,
}: {
  userId: string;
  routeWords: UserWord[];
  clearedIds: number[];
  counts: { new: number; learning: number; due: number; mastered: number };
  totalWords: number;
  mistakesCount: number;
  lists: VocabList[];
  focusWord: UserWord | null;
}) {
  const [activeTab, setActiveTab] = useState<"today" | "mistakes" | "library" | "map">("today");
  const clearedSet = new Set(clearedIds);
  const clearedCount = routeWords.filter((w) => clearedSet.has(w.id)).length;
  const routePct = routeWords.length > 0 ? (clearedCount / routeWords.length) * 100 : 0;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* ===== HERO HEADER ===== */}
      <div className="grid lg:grid-cols-[1fr_320px] gap-6 mb-6">
        {/* Left: today's route hero */}
        <div className="bg-gradient-to-br from-cream-50 via-cream-100 to-cream-200 rounded-3xl p-7 border border-coffee-700/10 relative overflow-hidden">
          {/* subtle decorative motif */}
          <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-accent/8 blur-3xl pointer-events-none" />
          <div className="absolute right-10 bottom-6 opacity-20 pointer-events-none">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="38" stroke="#8B6B4A" strokeWidth="1" strokeDasharray="2 4"/>
              <circle cx="40" cy="40" r="20" stroke="#8B6B4A" strokeWidth="1" strokeDasharray="2 4"/>
            </svg>
          </div>

          <div className="relative">
            <div className="text-xs text-accent uppercase tracking-[0.18em] font-semibold mb-2">
              SAT Vocabulary
            </div>
            <div className="flex items-start gap-3 mb-1">
              <div className="text-4xl">🏔️</div>
              <h1 className="font-display text-3xl md:text-4xl font-semibold text-coffee-900 leading-tight">
                Today's Word Route
              </h1>
            </div>
            <p className="text-coffee-600 text-sm md:text-base mb-5">
              {routeWords.length} words assigned from your daily plan.
            </p>

            {/* Progress chip */}
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-sm font-medium text-coffee-800">
                {clearedCount}/{routeWords.length} cleared
              </div>
              <div className="text-xs text-coffee-500">{Math.round(routePct)}%</div>
            </div>
            <div className="h-2 bg-cream-50 rounded-full overflow-hidden mb-5 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-accent to-coffee-700 rounded-full transition-all duration-700"
                style={{ width: `${routePct}%` }}
              />
            </div>

            {/* Game-mode buttons */}
            <div className="flex flex-wrap gap-2.5">
              <Link
                href="/app/vocabulary/route"
                className="group bg-coffee-800 hover:bg-coffee-900 text-cream-50 px-5 py-3 rounded-full text-sm font-medium flex items-center gap-2 transition-all hover:scale-[1.02] hover:shadow-md"
              >
                <span className="text-base">▶️</span>
                <span>Start Route</span>
                <span className="opacity-60 group-hover:translate-x-0.5 transition-transform">→</span>
              </Link>
              <Link
                href="/app/vocabulary/mistakes"
                className="bg-cream-50 hover:bg-cream-100 border border-coffee-700/15 text-coffee-800 px-5 py-3 rounded-full text-sm font-medium flex items-center gap-2 transition-all hover:scale-[1.02]"
              >
                <span>📝</span>
                <span>Mistakes</span>
                {mistakesCount > 0 && (
                  <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full ml-1">
                    {mistakesCount}
                  </span>
                )}
              </Link>
              <Link
                href="/app/vocabulary/sprint"
                className="bg-cream-50 hover:bg-cream-100 border border-coffee-700/15 text-coffee-800 px-5 py-3 rounded-full text-sm font-medium flex items-center gap-2 transition-all hover:scale-[1.02]"
              >
                <span>⚡</span>
                <span>Match Sprint</span>
              </Link>
              <button
                onClick={() => setActiveTab("map")}
                className="bg-coffee-900 hover:bg-coffee-800 text-cream-50 px-5 py-3 rounded-full text-sm font-medium flex items-center gap-2 transition-all hover:scale-[1.02] hover:shadow-md"
              >
                <span>✨</span>
                <span>Constellation Map</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Focus Word + Build custom set */}
        <div className="space-y-4">
          {focusWord && (
            <div className="bg-coffee-900 text-cream-50 rounded-3xl p-6 relative overflow-hidden">
              {/* glow accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-cream-200/70 font-semibold">
                    Focus Word
                  </div>
                  <span className="text-accent text-xs">📍</span>
                </div>
                <div className="font-display text-3xl font-semibold mb-2">
                  {focusWord.word}
                </div>
                <p className="text-cream-200/80 text-sm leading-relaxed mb-3 line-clamp-3">
                  {focusWord.definition}
                </p>
                {focusWord.example && (
                  <p className="text-cream-200/50 text-xs italic line-clamp-2">
                    "{focusWord.example}"
                  </p>
                )}
                <div className="flex gap-1.5 mt-4">
                  <Bucket label="New" count={counts.new} color="bg-blue-400/30 text-blue-100" />
                  <Bucket label="Learn" count={counts.learning} color="bg-yellow-400/30 text-yellow-100" />
                  <Bucket label="Due" count={counts.due} color="bg-red-400/30 text-red-100" />
                </div>
              </div>
            </div>
          )}
          <Link
            href="/app/vocabulary/build"
            className="block bg-cream-50 hover:bg-cream-100 border border-dashed border-coffee-700/25 rounded-3xl p-4 text-center text-sm text-coffee-700 hover:text-coffee-900 transition-colors"
          >
            ＋ Build custom set
          </Link>
        </div>
      </div>

      {/* ===== TABS ===== */}
      <div className="flex bg-cream-50 border border-coffee-700/10 rounded-full p-1 mb-6 max-w-2xl">
        <TabBtn label="Today" active={activeTab === "today"} onClick={() => setActiveTab("today")} />
        <TabBtn
          label={`Mistakes${mistakesCount ? ` (${mistakesCount})` : ""}`}
          active={activeTab === "mistakes"}
          onClick={() => setActiveTab("mistakes")}
        />
        <TabBtn label="Library" active={activeTab === "library"} onClick={() => setActiveTab("library")} />
        <TabBtn label="Map ✨" active={activeTab === "map"} onClick={() => setActiveTab("map")} />
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div>
          {/* ===== TAB: TODAY ===== */}
          {activeTab === "today" && (
            <div>
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="font-display text-xl font-semibold text-coffee-900">
                  Clear the route
                </h2>
                <span className="text-[10px] uppercase tracking-wider text-accent font-semibold bg-accent/10 px-3 py-1 rounded-full">
                  Recommended first
                </span>
              </div>

              {routeWords.length === 0 ? (
                <EmptyState text="No words assigned yet. Save a word from a passage, or pick a list from the library." />
              ) : (
                <>
                  <Link
                    href="/app/vocabulary/route"
                    className="block bg-gradient-to-r from-cream-50 to-cream-100 hover:from-cream-100 hover:to-cream-200 border border-coffee-700/10 rounded-2xl p-5 mb-4 transition-all hover:scale-[1.005] group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-coffee-800 grid place-items-center text-cream-50 text-xl shrink-0 group-hover:scale-110 transition-transform">
                        ▶
                      </div>
                      <div className="flex-1">
                        <div className="font-display text-lg font-semibold text-coffee-900">
                          Start Word Route
                        </div>
                        <div className="text-sm text-coffee-600">
                          {routeWords.length} words from today's plan
                        </div>
                      </div>
                      <div className="text-coffee-500 group-hover:text-coffee-900 group-hover:translate-x-1 transition-all text-xl">
                        →
                      </div>
                    </div>
                  </Link>

                  <div className="grid sm:grid-cols-2 gap-2">
                    {routeWords.map((w) => {
                      const isCleared = clearedSet.has(w.id);
                      const state = w.mastery_state ?? "new";
                      return (
                        <div
                          key={w.id}
                          className={`bg-cream-50 border rounded-2xl p-3.5 flex items-center gap-3 transition-all hover:scale-[1.01] ${
                            isCleared ? "border-green-300 opacity-70" : "border-coffee-700/10"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-coffee-900 text-sm truncate">
                              {w.word}
                            </div>
                            <div className="text-[10px] uppercase tracking-wider text-coffee-500">
                              {isCleared ? "✓ cleared" : state}
                            </div>
                          </div>
                          <StateDot state={isCleared ? "mastered" : state} />
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ===== TAB: MISTAKES ===== */}
          {activeTab === "mistakes" && (
            <div>
              <h2 className="font-display text-xl font-semibold text-coffee-900 mb-3">
                Words you've missed
              </h2>
              {mistakesCount === 0 ? (
                <EmptyState text="No open mistakes! Keep going — when you miss a word in any review, it lands here." />
              ) : (
                <Link
                  href="/app/vocabulary/mistakes"
                  className="block bg-gradient-to-r from-red-50 to-cream-50 border border-red-200/60 rounded-2xl p-5 hover:scale-[1.005] transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">📝</div>
                    <div className="flex-1">
                      <div className="font-display font-semibold text-coffee-900">
                        Review {mistakesCount} mistake{mistakesCount === 1 ? "" : "s"}
                      </div>
                      <div className="text-sm text-coffee-600">
                        These are the words you got wrong — drill them until they stick.
                      </div>
                    </div>
                    <div className="text-coffee-500 text-xl">→</div>
                  </div>
                </Link>
              )}
            </div>
          )}

          {/* ===== TAB: LIBRARY ===== */}
          {activeTab === "library" && (
            <div>
              <h2 className="font-display text-xl font-semibold text-coffee-900 mb-3">
                Vocabulary Library
              </h2>
              {lists.length === 0 ? (
                <EmptyState text="No lists yet. Ask your admin to seed them." />
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {lists.map((l) => (
                    <Link
                      key={l.id}
                      href={`/app/vocabulary/${l.id}`}
                      className="group bg-cream-50 border border-coffee-700/10 rounded-2xl p-5 hover:scale-[1.01] hover:border-accent/40 transition-all"
                    >
                      <div className="text-3xl mb-2">📘</div>
                      <div className="font-display font-semibold text-coffee-900 mb-1">
                        {l.title}
                      </div>
                      {l.description && (
                        <div className="text-xs text-coffee-600 line-clamp-2 mb-3">
                          {l.description}
                        </div>
                      )}
                      <div className="text-xs text-accent group-hover:translate-x-1 transition-transform inline-block">
                        Open list →
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== TAB: CONSTELLATION MAP ===== */}
          {activeTab === "map" && (
            <ConstellationMap userId={userId} counts={counts} totalWords={totalWords} />
          )}
        </div>

        {/* ===== RIGHT RAIL: MASTERY ===== */}
        <div className="space-y-4">
          <div className="bg-cream-50 border border-coffee-700/10 rounded-3xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] uppercase tracking-[0.15em] text-coffee-500 font-semibold">
                Mastery
              </div>
              <span className="text-coffee-500 text-sm">📍</span>
            </div>
            <div className="font-display text-4xl font-semibold text-coffee-900 mb-1">
              {counts.mastered}
            </div>
            <div className="text-xs text-coffee-500 mb-4">of {totalWords} words</div>
            <div className="h-2 bg-cream-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent to-coffee-700 transition-all duration-700"
                style={{
                  width: `${totalWords > 0 ? (counts.mastered / totalWords) * 100 : 0}%`,
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 mt-5">
              <MasteryTile label="New" count={counts.new} tone="blue" />
              <MasteryTile label="Learning" count={counts.learning} tone="yellow" />
              <MasteryTile label="Due" count={counts.due} tone="red" />
              <MasteryTile label="Mastered" count={counts.mastered} tone="green" />
            </div>
          </div>

          {/* Etymology mini-panel */}
          {focusWord && <EtymologyPanel word={focusWord.word} />}
        </div>
      </div>
    </div>
  );
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 text-sm font-medium px-4 py-2 rounded-full transition-all ${
        active
          ? "bg-coffee-800 text-cream-50 shadow-sm"
          : "text-coffee-700 hover:text-coffee-900"
      }`}
    >
      {label}
    </button>
  );
}

function Bucket({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className={`${color} backdrop-blur rounded-full px-3 py-1 text-xs flex items-center gap-1.5`}>
      <span className="font-semibold">{count}</span>
      <span className="opacity-80">{label}</span>
    </div>
  );
}

function StateDot({ state }: { state: string }) {
  const colors: Record<string, string> = {
    new: "bg-blue-400",
    learning: "bg-yellow-500",
    due: "bg-red-500",
    mastered: "bg-green-500",
  };
  return <div className={`w-2 h-2 rounded-full ${colors[state] ?? "bg-coffee-500"}`} />;
}

function MasteryTile({ label, count, tone }: { label: string; count: number; tone: "blue" | "yellow" | "red" | "green" }) {
  const tones = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    red: "bg-red-50 text-red-700 border-red-200",
    green: "bg-green-50 text-green-700 border-green-200",
  };
  return (
    <div className={`${tones[tone]} border rounded-xl p-3`}>
      <div className="text-[10px] uppercase tracking-wider opacity-70 font-semibold">{label}</div>
      <div className="font-display text-2xl font-semibold">{count}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="bg-cream-50 border border-coffee-700/10 rounded-2xl p-10 text-center">
      <div className="text-4xl mb-2">📝</div>
      <p className="text-sm text-coffee-600 max-w-md mx-auto">{text}</p>
    </div>
  );
}
