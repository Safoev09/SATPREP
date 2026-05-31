"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase-client";

type Word = {
  id: number;
  word: string;
  part_of_speech: string | null;
  definition: string;
  example: string | null;
};

export default function VocabFlashcards({
  userId,
  listTitle,
  listDescription,
  listId,
  words,
}: {
  userId: string;
  listTitle: string;
  listDescription: string | null;
  listId: number;
  words: Word[];
}) {
  const supabase = createClient();
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [savedSet, setSavedSet] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);

  const current = words[idx];
  const isLast = idx >= words.length - 1;

  const saveToPersonal = async () => {
    setBusy(true);
    const { error } = await supabase.from("user_vocab").insert({
      user_id: userId,
      word: current.word,
      definition: current.definition,
      example: current.example,
      source_type: "list",
      source_list_id: listId,
    });
    setBusy(false);
    if (!error) {
      setSavedSet(new Set([...savedSet, current.id]));
    }
  };

  const next = () => {
    if (isLast) return;
    setIdx(idx + 1);
    setRevealed(false);
  };
  const prev = () => {
    if (idx === 0) return;
    setIdx(idx - 1);
    setRevealed(false);
  };

  const progress = ((idx + 1) / words.length) * 100;

  return (
    <div className="min-h-[calc(100vh-65px)] flex flex-col">
      {/* Header */}
      <div className="px-8 py-5 border-b border-coffee-700/10 dark:border-cream-200/8">
        <div className="flex items-center justify-between gap-4 max-w-3xl mx-auto">
          <Link
            href="/app/vocabulary"
            className="text-sm text-coffee-600 dark:text-cream-200/70 hover:text-coffee-900 dark:hover:text-cream-50 transition"
          >
            ← Back
          </Link>
          <div className="text-center">
            <div className="text-xs text-accent uppercase tracking-wider font-semibold">
              {listTitle}
            </div>
            <div className="text-xs text-coffee-500 dark:text-cream-200/50">
              {idx + 1} of {words.length}
            </div>
          </div>
          <div className="w-12" />
        </div>
        <div className="max-w-3xl mx-auto mt-3">
          <div className="h-1 bg-cream-100 dark:bg-midnight-50 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-xl">
          <div
            onClick={() => setRevealed(!revealed)}
            className="bg-cream-50 dark:bg-midnight-100 border border-coffee-700/10 dark:border-cream-200/8 rounded-3xl p-10 cursor-pointer hover:shadow-lg transition-all duration-300 min-h-[280px] flex flex-col justify-center"
          >
            <div className="text-center">
              <div className="font-display text-4xl sm:text-5xl font-semibold text-coffee-900 dark:text-cream-50 mb-2">
                {current.word}
              </div>
              {current.part_of_speech && (
                <div className="text-xs text-coffee-500 dark:text-cream-200/50 italic mb-6">
                  {current.part_of_speech}
                </div>
              )}

              {revealed ? (
                <div className="mt-4 animate-[fadeup_0.4s_ease-out]">
                  <div className="text-lg text-coffee-700 dark:text-cream-200/90 leading-relaxed">
                    {current.definition}
                  </div>
                  {current.example && (
                    <div className="mt-4 text-sm italic text-coffee-500 dark:text-cream-200/60 leading-relaxed">
                      "{current.example}"
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-coffee-500 dark:text-cream-200/40 mt-6">
                  Tap to reveal definition
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              onClick={prev}
              disabled={idx === 0}
              className="px-5 py-2.5 text-sm rounded-full bg-cream-100 dark:bg-midnight-50 text-coffee-800 dark:text-cream-200 hover:bg-cream-200 dark:hover:bg-midnight-50/80 disabled:opacity-30 transition"
            >
              ← Previous
            </button>

            <button
              onClick={saveToPersonal}
              disabled={busy || savedSet.has(current.id)}
              className={`px-5 py-2.5 text-sm rounded-full transition-all ${
                savedSet.has(current.id)
                  ? "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300"
                  : "bg-accent/15 dark:bg-accent/20 text-accent hover:scale-[1.02]"
              } disabled:opacity-50`}
            >
              {savedSet.has(current.id) ? "✓ Saved" : "☆ Save to my words"}
            </button>

            <button
              onClick={next}
              disabled={isLast}
              className="px-5 py-2.5 text-sm rounded-full bg-coffee-800 dark:bg-accent text-cream-50 hover:scale-[1.02] disabled:opacity-30 transition"
            >
              Next →
            </button>
          </div>

          {isLast && revealed && (
            <div className="mt-6 text-center">
              <Link
                href="/app/vocabulary"
                className="inline-block text-sm text-accent hover:underline"
              >
                ✓ Finished this list — back to vocabulary
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
