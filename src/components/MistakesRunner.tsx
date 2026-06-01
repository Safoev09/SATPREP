"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase-client";

type Mistake = {
  id: number;
  word: string;
  definition: string;
  example: string | null;
};

export default function MistakesRunner({
  userId,
  mistakes,
}: {
  userId: string;
  mistakes: Mistake[];
}) {
  const supabase = createClient();
  const [queue, setQueue] = useState<Mistake[]>(mistakes);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [stats, setStats] = useState({ resolved: 0, still: 0 });
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const current = queue[idx];
  const isLast = idx >= queue.length - 1;
  const progress = ((idx + (revealed ? 0.5 : 0)) / queue.length) * 100;

  const grade = async (knewIt: boolean) => {
    if (busy || !current) return;
    setBusy(true);

    if (knewIt) {
      // Mark mistake resolved
      await supabase
        .from("vocab_mistakes")
        .update({ resolved_at: new Date().toISOString() })
        .eq("id", current.id);
      // Also nudge mastery upward
      await supabase
        .from("user_vocab")
        .update({ mastery_state: "learning" })
        .eq("user_id", userId)
        .eq("word", current.word)
        .eq("mastery_state", "due");
    }

    setStats({
      resolved: stats.resolved + (knewIt ? 1 : 0),
      still: stats.still + (knewIt ? 0 : 1),
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
        <div className="bg-cream-50 border border-coffee-700/10 rounded-3xl p-10 text-center">
          <div className="text-5xl mb-3">📝</div>
          <h1 className="font-display text-3xl font-semibold text-coffee-900 mb-1">
            Mistakes reviewed
          </h1>
          <p className="text-coffee-600 mb-7">
            {stats.resolved} resolved · {stats.still} still need work.
          </p>
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
      <div className="px-6 py-4 border-b border-coffee-700/10">
        <div className="flex items-center justify-between max-w-3xl mx-auto gap-4">
          <Link href="/app/vocabulary" className="text-sm text-coffee-600 hover:text-coffee-900">
            ← Exit
          </Link>
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-wider text-accent font-semibold">
              Mistakes
            </div>
            <div className="text-xs text-coffee-500">{idx + 1} of {queue.length}</div>
          </div>
          <div className="text-xs text-coffee-500 whitespace-nowrap">
            ✓ {stats.resolved} · • {stats.still}
          </div>
        </div>
        <div className="max-w-3xl mx-auto mt-3 h-1.5 bg-cream-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent to-coffee-700 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-xl">
          <div className="bg-cream-50 border border-coffee-700/10 rounded-3xl p-10 min-h-[300px] flex flex-col justify-center text-center">
            <div className="font-display text-5xl font-semibold text-coffee-900 mb-3">
              {current.word}
            </div>
            {revealed ? (
              <div className="animate-[fadeup_0.4s_ease-out]">
                <div className="text-lg text-coffee-700 leading-relaxed">
                  {current.definition || <em className="text-coffee-500">No definition saved</em>}
                </div>
                {current.example && (
                  <div className="mt-4 text-sm italic text-coffee-500">
                    "{current.example}"
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => setRevealed(true)} className="text-sm text-accent hover:underline mt-4">
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
                <div className="font-medium">Still hard</div>
                <div className="text-[11px] text-coffee-500">Keep it in mistakes</div>
              </button>
              <button
                onClick={() => grade(true)}
                disabled={busy}
                className="px-6 py-4 rounded-2xl bg-coffee-800 hover:bg-coffee-900 text-cream-50 transition hover:scale-[1.01] disabled:opacity-50"
              >
                <div className="font-medium">Got it ✓</div>
                <div className="text-[11px] text-cream-200/70">Mark resolved</div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
