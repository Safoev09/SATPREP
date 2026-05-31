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

// Leitner box intervals (in days): how soon to review again based on the new box
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

  const current = queue[idx];
  const progress = ((idx + (revealed ? 0.5 : 0)) / queue.length) * 100;

  const grade = async (knewIt: boolean) => {
    // Advance the box on success, demote to box 1 on failure
    const newBox = knewIt
      ? Math.min((current.box ?? 1) + 1, 5)
      : 1;
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
  };

  if (done) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-cream-50 border border-coffee-700/10 rounded-3xl p-10 text-center">
          <div className="text-5xl mb-3">✨</div>
          <h1 className="font-display text-3xl font-semibold text-coffee-900 mb-1">
            Review complete
          </h1>
          <p className="text-coffee-600 mb-6">
            You reviewed {queue.length} words.
          </p>
          <div className="flex justify-center gap-6 mb-8">
            <div>
              <div className="font-display text-3xl font-semibold text-coffee-900">
                {stats.correct}
              </div>
              <div className="text-xs text-coffee-500 uppercase tracking-wider">
                Knew it
              </div>
            </div>
            <div>
              <div className="font-display text-3xl font-semibold text-coffee-900">
                {stats.missed}
              </div>
              <div className="text-xs text-coffee-500 uppercase tracking-wider">
                Try again soon
              </div>
            </div>
          </div>
          <Link
            href="/app/vocabulary"
            className="inline-block bg-coffee-800 text-cream-50 px-6 py-2.5 rounded-full text-sm font-medium hover:scale-[1.02] transition"
          >
            Back to vocabulary
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-65px)] flex flex-col">
      <div className="px-8 py-5 border-b border-coffee-700/10">
        <div className="flex items-center justify-between gap-4 max-w-3xl mx-auto">
          <Link
            href="/app/vocabulary"
            className="text-sm text-coffee-600 hover:text-coffee-900 transition"
          >
            ← Exit
          </Link>
          <div className="text-xs text-accent uppercase tracking-wider font-semibold">
            Spaced review · {idx + 1} of {queue.length}
          </div>
          <div className="text-xs text-coffee-500">
            ✓ {stats.correct} · ✗ {stats.missed}
          </div>
        </div>
        <div className="max-w-3xl mx-auto mt-3">
          <div className="h-1 bg-cream-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-xl">
          <div className="bg-cream-50 border border-coffee-700/10 rounded-3xl p-10 min-h-[300px] flex flex-col justify-center text-center">
            <div className="font-display text-4xl sm:text-5xl font-semibold text-coffee-900 mb-2">
              {current.word}
            </div>
            <div className="text-xs text-coffee-500 mb-6">
              Box {current.box} of 5
            </div>

            {revealed ? (
              <div className="animate-[fadeup_0.4s_ease-out]">
                <div className="text-lg text-coffee-700 leading-relaxed">
                  {current.definition}
                </div>
                {current.example && (
                  <div className="mt-4 text-sm italic text-coffee-500">
                    "{current.example}"
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setRevealed(true)}
                className="text-sm text-accent hover:underline mt-6"
              >
                Show definition
              </button>
            )}
          </div>

          {revealed && (
            <div className="mt-6 grid grid-cols-2 gap-3 animate-[fadeup_0.4s_ease-out]">
              <button
                onClick={() => grade(false)}
                className="px-6 py-3.5 rounded-2xl bg-cream-100 text-coffee-800 hover:scale-[1.02] hover:bg-cream-200 transition"
              >
                <div className="font-medium">Didn't know</div>
                <div className="text-xs text-coffee-500">Review tomorrow</div>
              </button>
              <button
                onClick={() => grade(true)}
                className="px-6 py-3.5 rounded-2xl bg-coffee-800 text-cream-50 hover:scale-[1.02] transition"
              >
                <div className="font-medium">Knew it ✓</div>
                <div className="text-xs text-cream-100/70">
                  Next: {BOX_INTERVALS_DAYS[Math.min(current.box, 4)]}d
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
