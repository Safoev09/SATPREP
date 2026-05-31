"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { lookupWord } from "@/lib/dictionary";

type UserWord = {
  id: number;
  word: string;
  definition: string | null;
  example: string | null;
  source_type: string | null;
  box: number;
  next_review_at: string;
  times_correct: number;
  times_seen: number;
  created_at: string;
};

type VocabList = {
  id: number;
  title: string;
  description: string | null;
};

export default function VocabularyView({
  userId,
  myWords,
  lists,
  listWordCounts,
  dueCount,
}: {
  userId: string;
  myWords: UserWord[];
  lists: VocabList[];
  listWordCounts: Record<number, number>;
  dueCount: number;
}) {
  const supabase = createClient();
  const [words, setWords] = useState<UserWord[]>(myWords);
  const [addOpen, setAddOpen] = useState(false);
  const [newWord, setNewWord] = useState("");
  const [newDef, setNewDef] = useState("");
  const [newExample, setNewExample] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAutoFetch = async () => {
    if (!newWord.trim()) return;
    setBusy(true);
    setError(null);
    const entry = await lookupWord(newWord);
    if (entry) {
      setNewDef(entry.definition);
      if (entry.example) setNewExample(entry.example);
    } else {
      setError("Couldn't find that word — you can type the definition yourself.");
    }
    setBusy(false);
  };

  const handleSave = async () => {
    const w = newWord.trim().toLowerCase();
    const d = newDef.trim();
    if (!w || !d) {
      setError("Word and definition are required.");
      return;
    }
    setBusy(true);
    setError(null);
    const { data, error: insertErr } = await supabase
      .from("user_vocab")
      .insert({
        user_id: userId,
        word: w,
        definition: d,
        example: newExample.trim() || null,
        source_type: "manual",
      })
      .select()
      .single();
    setBusy(false);
    if (insertErr) {
      setError(
        insertErr.code === "23505"
          ? "You already saved this word."
          : "Could not save: " + insertErr.message
      );
      return;
    }
    if (data) setWords([data as UserWord, ...words]);
    setNewWord("");
    setNewDef("");
    setNewExample("");
    setAddOpen(false);
  };

  const handleDelete = async (id: number) => {
    await supabase.from("user_vocab").delete().eq("id", id);
    setWords(words.filter((w) => w.id !== id));
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="text-xs text-accent uppercase tracking-[0.15em] font-semibold mb-1">
            Vocabulary
          </div>
          <h1 className="font-display text-4xl font-semibold text-coffee-900">
            Build your word power
          </h1>
          <p className="text-coffee-600 mt-1.5">
            Save words from passages, drill pre-made lists, review with spaced repetition.
          </p>
        </div>
        <div className="flex gap-2">
          {dueCount > 0 && (
            <Link
              href="/app/vocabulary/review"
              className="bg-accent hover:bg-accent/90 text-cream-50 px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 transition-all hover:scale-[1.02]"
            >
              <span>📚</span> Review {dueCount} due
            </Link>
          )}
          <button
            onClick={() => setAddOpen(true)}
            className="bg-coffee-800 hover:bg-coffee-900 text-cream-50 px-5 py-2.5 rounded-full text-sm font-medium transition-all hover:scale-[1.02]"
          >
            + Add word
          </button>
        </div>
      </div>

      {/* Pre-made lists */}
      <div className="mb-10">
        <h2 className="font-display text-xl font-semibold text-coffee-900 mb-4">
          Pre-made lists
        </h2>
        {lists.length === 0 ? (
          <div className="bg-cream-50 border border-coffee-700/10 rounded-2xl p-6 text-center text-sm text-coffee-600">
            No lists available yet. Run the vocabulary seed file to add Essential SAT 200.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <div className="text-xs text-coffee-600 mb-3 line-clamp-2">
                    {l.description}
                  </div>
                )}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-coffee-500">
                    {listWordCounts[l.id] ?? 0} words
                  </span>
                  <span className="text-accent group-hover:translate-x-0.5 transition-transform">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Personal saved words */}
      <div>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display text-xl font-semibold text-coffee-900">
            Your saved words
          </h2>
          <span className="text-sm text-coffee-500">
            {words.length} total
          </span>
        </div>

        {words.length === 0 ? (
          <div className="bg-cream-50 border border-coffee-700/10 rounded-2xl p-10 text-center">
            <div className="text-4xl mb-2">📝</div>
            <div className="font-display font-medium text-coffee-900 mb-1">
              No saved words yet
            </div>
            <p className="text-sm text-coffee-600 max-w-md mx-auto">
              Tip: while practising, double-click any word in a Reading passage to save it here.
              Or use the <span className="font-medium">+ Add word</span> button above.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {words.map((w) => (
              <div
                key={w.id}
                className="bg-cream-50 border border-coffee-700/10 rounded-2xl p-4 group hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="font-display font-semibold text-coffee-900 text-lg">
                    {w.word}
                  </div>
                  <button
                    onClick={() => handleDelete(w.id)}
                    className="text-coffee-500 hover:text-red-600 text-xs opacity-0 group-hover:opacity-100 transition"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
                <div className="text-sm text-coffee-700 leading-snug mb-2">
                  {w.definition}
                </div>
                {w.example && (
                  <div className="text-xs italic text-coffee-500 leading-snug">
                    "{w.example}"
                  </div>
                )}
                <div className="flex gap-1 mt-3">
                  {[1, 2, 3, 4, 5].map((b) => (
                    <div
                      key={b}
                      className={`h-1 flex-1 rounded-full ${
                        b <= w.box
                          ? "bg-accent"
                          : "bg-cream-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add word modal */}
      {addOpen && (
        <div
          className="fixed inset-0 bg-coffee-900/40 z-50 flex items-center justify-center p-4"
          onClick={() => setAddOpen(false)}
        >
          <div
            className="glass rounded-3xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-xl font-semibold text-coffee-900 mb-4">
              Add a word
            </h3>
            <div className="space-y-3">
              <div>
                <label>Word</label>
                <input
                  type="text"
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  placeholder="e.g. ephemeral"
                  autoFocus
                />
                <button
                  onClick={handleAutoFetch}
                  disabled={busy || !newWord.trim()}
                  className="text-xs text-accent mt-1 hover:underline disabled:opacity-50"
                >
                  ✨ Auto-fetch definition
                </button>
              </div>
              <div>
                <label>Definition</label>
                <textarea
                  value={newDef}
                  onChange={(e) => setNewDef(e.target.value)}
                  rows={2}
                  placeholder="The meaning of the word…"
                />
              </div>
              <div>
                <label>Example (optional)</label>
                <input
                  type="text"
                  value={newExample}
                  onChange={(e) => setNewExample(e.target.value)}
                  placeholder="A sentence using the word"
                />
              </div>
              {error && (
                <div className="text-sm text-red-700">{error}</div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setAddOpen(false)}
                  className="px-4 py-2 text-sm text-coffee-700 hover:bg-cream-100/50 rounded-full"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={busy}
                  className="px-5 py-2 text-sm bg-coffee-800 text-cream-50 rounded-full hover:scale-[1.02] transition disabled:opacity-50"
                >
                  {busy ? "Saving…" : "Save word"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
