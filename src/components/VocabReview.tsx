"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase-client";

type UserWord = {
  id: number;
  word: string;
  definition: string | null;
  example: string | null;
  box: number;
  next_review_at: string;
  times_correct: number;
  times_seen: number;
};

const BOX_INTERVALS_DAYS = [1, 3, 7, 14, 30];

export default function VocabReview({
  userId,
  dueWords,
}: {
  userId: string;
  dueWords: UserWord[];
}) {
  const supabase = createClient();
  const [queue] = useState(dueWords);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [stats, setStats] = useState({ correct: 0, missed: 0 });
  const [done, setDone] = useState(false);
  const [grading, setGrading] = useState(false);

  const current = queue[idx];
  const progress = ((idx + (revealed ? 0.5 : 0)) / queue.length) * 100;
  const nextBoxInterval = BOX_INTERVALS_DAYS[Math.min((current?.box ?? 1), 4)];

  const grade = async (knewIt: boolean) => {
    if (grading) return;
    setGrading(true);

    const newBox = knewIt ? Math.min((current.box ?? 1) + 1, 5) : 1;
    const intervalDays = BOX_INTERVALS_DAYS[newBox - 1];
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + intervalDays);

    await supabase
      .from("user_vocab")
      .update({
        box: newBox,
        next_review_at: nextReview.toISOString(),
        times_seen: (current.times_seen ?? 0) + 1,
        times_correct: (current.times_correct ?? 0) + (knewIt ? 1 : 0),
      })
      .eq("id", current.id);

    setStats((s) => ({
      correct: s.correct + (knewIt ? 1 : 0),
      missed: s.missed + (knewIt ? 0 : 1),
    }));

    if (idx >= queue.length - 1) {
      setDone(true);
    } else {
      setIdx(idx + 1);
      setRevealed(false);
    }
    setGrading(false);
  };

  if (done) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-cream-50 border border-coffee-700/10 rounded-3xl p-10 text-center shadow-lg">
          <div className="text-6xl mb-4">✨</div>
          <h1 className="font-display text-3xl font-semibold text-coffee-900 mb-2">
            Review complete!
          </h1>
          <p className="text-coffee-600 mb-8">You reviewed {queue.length} words today.</p>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
              <div className="font-display text-4xl font-semibold text-green-700">{stats.correct}</div>
              <div className="text-xs text-green-600 uppercase tracking-wider mt-1">Knew it</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <div className="font-display text-4xl font-semibold text-red-600">{stats.missed}</div>
              <div className="text-xs text-red-500 uppercase tracking-wider mt-1">Try again</div>
            </div>
          </div>
          <Link
            href="/app/vocabulary"
            className="inline-block bg-coffee-800 text-cream-50 px-8 py-3 rounded-full text-sm font-medium hover:bg-coffee-900 transition"
          >
            Back to vocabulary →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-65px)] flex flex-col bg-cream-100">
      {/* Header */}
      <div className="px-6 py-4 border-b border-coffee-700/10 bg-cream-50">
        <div className="flex items-center justify-between gap-4 max-w-2xl mx-auto">
          <Link href="/app/vocabulary" className="text-sm text-coffee-600 hover:text-coffee-900 transition">
            ← Exit
          </Link>
          <div className="text-xs text-accent uppercase tracking-wider font-semibold">
            {idx + 1} of {queue.length}
          </div>
          <div className="flex items-center gap-3 text-xs text-coffee-500">
            <span className="text-green-600 font-semibold">✓ {stats.correct}</span>
            <span className="text-red-500 font-semibold">✗ {stats.missed}</span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="max-w-2xl mx-auto mt-3">
          <div className="h-1.5 bg-cream-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Card area */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg space-y-4">

          {/* The card — tap ANYWHERE to reveal */}
          <div
            onClick={() => !revealed && setRevealed(true)}
            className={`bg-cream-50 border-2 rounded-3xl p-10 text-center shadow-md transition-all duration-150 select-none ${
              !revealed
                ? "border-coffee-700/15 cursor-pointer hover:border-accent/40 hover:shadow-lg active:scale-[0.99]"
                : "border-coffee-700/15 cursor-default"
            }`}
            style={{ minHeight: "280px", display: "flex", flexDirection: "column", justifyContent: "center" }}
          >
            {/* Box indicator */}
            <div className="flex justify-center gap-1 mb-5">
              {[1,2,3,4,5].map(b => (
                <div
                  key={b}
                  className={`h-1.5 w-8 rounded-full transition-colors ${
                    b <= (current.box ?? 1) ? "bg-accent" : "bg-cream-200"
                  }`}
                />
              ))}
            </div>

            {/* Word */}
            <div className="font-display text-5xl sm:text-6xl font-semibold text-coffee-900 mb-3 leading-tight">
              {current.word}
            </div>

            {/* Reveal hint or definition */}
            {!revealed ? (
              <div className="mt-4">
                <div className="text-sm text-coffee-400">Tap anywhere to reveal</div>
              </div>
            ) : (
              <div>
                <div className="w-12 h-px bg-coffee-200 mx-auto mb-4" />
                <div className="text-lg text-coffee-700 leading-relaxed font-medium">
                  {current.definition}
                </div>
                {current.example && (
                  <div className="mt-4 text-sm italic text-coffee-500 leading-relaxed">
                    "{current.example}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Grading buttons — appear instantly when revealed */}
          {revealed && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => grade(false)}
                disabled={grading}
                className="px-6 py-4 rounded-2xl bg-cream-50 border-2 border-red-200 text-coffee-800 hover:bg-red-50 hover:border-red-300 active:scale-[0.98] transition disabled:opacity-50 text-left"
              >
                <div className="font-semibold text-red-700">✗ Didn't know</div>
                <div className="text-xs text-coffee-500 mt-0.5">Back to tomorrow</div>
              </button>
              <button
                onClick={() => grade(true)}
                disabled={grading}
                className="px-6 py-4 rounded-2xl bg-coffee-800 border-2 border-coffee-800 text-cream-50 hover:bg-coffee-900 active:scale-[0.98] transition disabled:opacity-50 text-left"
              >
                <div className="font-semibold">✓ Knew it</div>
                <div className="text-xs text-cream-200/70 mt-0.5">Next in {nextBoxInterval}d</div>
              </button>
            </div>
          )}

          {/* Keyboard shortcut hint */}
          {revealed && (
            <div className="text-center text-xs text-coffee-400">
              Press <kbd className="bg-cream-200 px-1.5 py-0.5 rounded text-coffee-600">←</kbd> didn't know · <kbd className="bg-cream-200 px-1.5 py-0.5 rounded text-coffee-600">→</kbd> knew it
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
