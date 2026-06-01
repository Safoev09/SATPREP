import Link from "next/link";
import { requireStudent } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase-server";
import MatchSprintRunner from "@/components/MatchSprintRunner";

export default async function MatchSprintPage() {
  const { profile } = await requireStudent();
  const supabase = createClient();

  // Pull a pool of words: prefer user's own non-mastered + a few mastered for distractors
  const { data: userWords } = await supabase
    .from("user_vocab")
    .select("id, word, definition")
    .eq("user_id", profile.id)
    .not("definition", "is", null)
    .limit(60);

  if (!userWords || userWords.length < 4) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-cream-50 border border-coffee-700/10 rounded-3xl p-10 text-center">
          <div className="text-4xl mb-3">⚡</div>
          <h1 className="font-display text-2xl font-semibold text-coffee-900 mb-2">
            Need a few more words first
          </h1>
          <p className="text-coffee-600 mb-5">
            Match Sprint needs at least 4 saved words. Save more from passages or pick a list.
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

  return <MatchSprintRunner userId={profile.id} pool={userWords as any} />;
}
