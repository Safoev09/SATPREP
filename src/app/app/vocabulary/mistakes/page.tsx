import Link from "next/link";
import { requireStudent } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase-server";
import MistakesRunner from "@/components/MistakesRunner";

export default async function MistakesPage() {
  const { profile } = await requireStudent();
  const supabase = createClient();

  const { data: mistakes } = await supabase
    .from("vocab_mistakes")
    .select("*")
    .eq("user_id", profile.id)
    .is("resolved_at", null)
    .order("wrong_at", { ascending: true })
    .limit(50);

  if (!mistakes || mistakes.length === 0) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-cream-50 border border-coffee-700/10 rounded-3xl p-10 text-center">
          <div className="text-5xl mb-3">✨</div>
          <h1 className="font-display text-2xl font-semibold text-coffee-900 mb-2">
            No open mistakes
          </h1>
          <p className="text-coffee-600 mb-5">
            Words you miss in any review will land here. Right now, your slate is clean.
          </p>
          <Link
            href="/app/vocabulary"
            className="inline-block bg-coffee-800 text-cream-50 px-5 py-2.5 rounded-full text-sm font-medium hover:scale-[1.02] transition"
          >
            ← Back to vocabulary
          </Link>
        </div>
      </div>
    );
  }

  // Join with user_vocab to get the latest definition
  const words = mistakes.map((m) => m.word);
  const { data: userVocab } = await supabase
    .from("user_vocab")
    .select("word, definition, example")
    .eq("user_id", profile.id)
    .in("word", words);

  const defByWord: Record<string, { definition: string; example: string | null }> = {};
  (userVocab ?? []).forEach((w) => {
    defByWord[w.word] = { definition: w.definition ?? "", example: w.example };
  });

  const enriched = mistakes.map((m) => ({
    id: m.id,
    word: m.word,
    definition: defByWord[m.word]?.definition ?? "",
    example: defByWord[m.word]?.example ?? null,
  }));

  return <MistakesRunner userId={profile.id} mistakes={enriched} />;
}
