"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase-client";

type Word = {
  id: number;
  word: string;
  definition: string | null;
  example: string | null;
  mastery_state: "new" | "learning" | "due" | "mastered" | null;
};

// Mastery transition map
// knew it → progress upward; didn't know → fall back
const ADVANCE: Record<string, "new" | "learning" | "due" | "mastered"> = {
  new: "learning",
  learning: "mastered",
  due: "mastered",
  mastered: "mastered",
};
const REGRESS: Record<string, "new" | "learning" | "due" | "mastered"> = {
  new: "new",
  learning: "due",
  due: "due",
  mastered: "due",
};

const REVIEW_INTERVAL_DAYS: Record<string, number> = {
  new: 1,
  learning: 3,
  due: 1,
  mastered: 14,
};

export default function WordRouteRunner({
  userId,
  routeId,
  words,
  clearedIds: initialCleared,
}: {
  userId: string;
  routeId: number;
  words: Word[];
  clearedIds: number[];
}) {
  const supabase = createClient();
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [clearedIds, setClearedIds] = useState<Set<number>>(new Set(initialCleared));
  const [stats, setStats] = useState({ knew: 0, missed: 0 });
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const current = words[idx];
  const isLast = idx >= words.length - 1;
  const progress = ((idx + (revealed ? 0.5 : 0)) / words.length) * 100;

  const grade = async (knewIt: boolean) => {
    if (busy || !current) return;
    setBusy(true);

    const currentState = (current.mastery_state ?? "new") as keyof typeof ADVANCE;
    const newState = knewIt ? ADVANCE[currentState] : REGRESS[currentState];
    const days = REVIEW_INTERVAL_DAYS[newState] ?? 1;
    const next = new Date();
    next.setDate(next.getDate() + days);

    await supabase
      .from("user_vocab")
      .update({
        mastery_state: newState,
        next_review_at: next.toISOString(),
      })
      .eq("id", current.id);

    // Add to cleared list on the route
    const newCleared = new Set(clearedIds);
    newCleared.add(current.id);
    setClearedIds(newCleared);
    await supabase
      .from("daily_routes")
      .update({ cleared_word_ids: Array.from(newCleared) })
      .eq("id", routeId);

    // If missed, log a mistake
    if (!knewIt) {
      await supabase.from("vocab_mistakes").insert({
        user_id: userId,
        word: current.word,
      });
    }

    setStats({
      knew: stats.knew + (knewIt ? 1 : 0),
      missed: stats.missed + (knewIt ? 0 : 1),
    });

    if (isLast) {
      setDone(true);
    } else {
      setIdx(idx + 1);
      setRevealed(false);
    }
    setBusy(false);
  };

  if (done) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-cream-50 to-cream-200 border border-coffee-700/10 rounded-3xl p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-accent/15 blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="text-5xl mb-3">🏔️</div>
            <h1 className="font-display text-3xl font-semibold text-coffee-900 mb-1">
              Route cleared
            </h1>
            <p className="text-coffee-600 mb-7">
              You worked through {words.length} words.
            </p>
            <div className="flex justify-center gap-8 mb-7">
              <div>
                <div className="font-display text-3xl font-semibold text-coffee-900">{stats.knew}</div>
                <div className="text-[10px] uppercase tracking-wider text-coffee-500">Knew</div>
              </div>
              <div>
                <div className="font-display text-3xl font-semibold text-coffee-900">{stats.missed}</div>
                <div className="text-[10px] uppercase tracking-wider text-coffee-500">Missed</div>
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
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-65px)] flex flex-col">
      {/* Top bar */}
      <div className="px-6 py-4 border-b border-coffee-700/10">
        <div className="flex items-center justify-between max-w-3xl mx-auto gap-4">
          <Link href="/app/vocabulary" className="text-sm text-coffee-600 hover:text-coffee-900">
            ← Exit
          </Link>
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-wider text-accent font-semibold">
              Today's Word Route
            </div>
            <div className="text-xs text-coffee-500">{idx + 1} of {words.length}</div>
          </div>
          <div className="text-xs text-coffee-500 whitespace-nowrap">
            ✓ {stats.knew} · ✗ {stats.missed}
          </div>
        </div>
        <div className="max-w-3xl mx-auto mt-3 h-1.5 bg-cream-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent to-coffee-700 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-xl">
          <div className="bg-cream-50 border border-coffee-700/10 rounded-3xl p-10 min-h-[320px] flex flex-col justify-center text-center relative overflow-hidden">
            {/* state ribbon */}
            <div className="absolute top-4 left-4 text-[10px] uppercase tracking-wider text-coffee-500 font-semibold">
              {current.mastery_state ?? "new"}
            </div>

            <div className="font-display text-5xl font-semibold text-coffee-900 mb-3">
              {current.word}
            </div>

            {revealed ? (
              <div className="animate-[fadeup_0.4s_ease-out]">
                <div className="text-lg text-coffee-700 leading-relaxed">
                  {current.definition}
                </div>
                {current.example && (
                  <div className="mt-4 text-sm italic text-coffee-500 leading-relaxed">
                    "{current.example}"
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setRevealed(true)}
                className="text-sm text-accent hover:underline mt-4"
              >
                Tap to reveal definition
              </button>
            )}
          </div>

          {revealed && (
            <div className="mt-6 grid grid-cols-2 gap-3 animate-[fadeup_0.3s_ease-out]">
              <button
                onClick={() => grade(false)}
                disabled={busy}
                className="px-6 py-4 rounded-2xl bg-cream-100 hover:bg-cream-200 text-coffee-800 transition hover:scale-[1.01] disabled:opacity-50"
              >
                <div className="font-medium">Didn't know</div>
                <div className="text-[11px] text-coffee-500">Review again soon</div>
              </button>
              <button
                onClick={() => grade(true)}
                disabled={busy}
                className="px-6 py-4 rounded-2xl bg-coffee-800 hover:bg-coffee-900 text-cream-50 transition hover:scale-[1.01] disabled:opacity-50"
              >
                <div className="font-medium">Knew it ✓</div>
                <div className="text-[11px] text-cream-200/70">
                  {current.mastery_state === "learning"
                    ? "Mark as mastered"
                    : current.mastery_state === "new"
                    ? "Move to learning"
                    : "Confirmed"}
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
