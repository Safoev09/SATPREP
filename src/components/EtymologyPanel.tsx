"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-client";

type Related = {
  word: string;
  definition: string | null;
};

export default function EtymologyPanel({ word }: { word: string }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [root, setRoot] = useState<string | null>(null);
  const [rootMeaning, setRootMeaning] = useState<string | null>(null);
  const [rootOrigin, setRootOrigin] = useState<string | null>(null);
  const [related, setRelated] = useState<Related[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      // Look up the word in the global vocab_words table to find its root
      const { data: wordRow } = await supabase
        .from("vocab_words")
        .select("root, root_meaning, root_origin")
        .ilike("word", word)
        .not("root", "is", null)
        .neq("root", "")
        .limit(1)
        .maybeSingle();

      if (!wordRow?.root) {
        setLoading(false);
        return;
      }

      setRoot(wordRow.root);
      setRootMeaning(wordRow.root_meaning);
      setRootOrigin(wordRow.root_origin);

      // Find sibling words with the same root
      const { data: siblings } = await supabase
        .from("vocab_words")
        .select("word, definition")
        .eq("root", wordRow.root)
        .neq("word", word)
        .limit(5);

      setRelated(siblings ?? []);
      setLoading(false);
    })();
  }, [word, supabase]);

  if (loading) {
    return (
      <div className="bg-cream-50 border border-coffee-700/10 rounded-3xl p-5">
        <div className="text-[10px] uppercase tracking-wider text-coffee-500">Etymology</div>
        <div className="text-xs text-coffee-500 mt-2">Searching root…</div>
      </div>
    );
  }

  if (!root) {
    return null; // no root data — hide panel silently
  }

  return (
    <div className="bg-cream-50 border border-coffee-700/10 rounded-3xl p-5">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] uppercase tracking-[0.15em] text-coffee-500 font-semibold">
          Etymology Tree
        </div>
        <span className="text-coffee-500 text-xs">🌳</span>
      </div>
      <div className="mb-3">
        <div className="text-[10px] uppercase tracking-wider text-accent font-semibold mb-0.5">
          {rootOrigin} root
        </div>
        <div className="font-display text-2xl font-semibold text-coffee-900">
          {root}
        </div>
        <div className="text-xs text-coffee-600 italic">
          "{rootMeaning}"
        </div>
      </div>
      {related.length > 0 && (
        <>
          <div className="text-[10px] uppercase tracking-wider text-coffee-500 mb-2 mt-4">
            Same family
          </div>
          <div className="space-y-1.5">
            {related.map((r) => (
              <div
                key={r.word}
                className="bg-cream-100 border border-coffee-700/5 rounded-lg px-3 py-2"
              >
                <div className="text-sm font-medium text-coffee-900">{r.word}</div>
                <div className="text-[11px] text-coffee-600 line-clamp-2 leading-snug">
                  {r.definition}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      <p className="text-[10px] text-coffee-500 mt-3 italic">
        Learn one root, unlock a family.
      </p>
    </div>
  );
}
