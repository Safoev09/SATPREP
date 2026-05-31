import Link from "next/link";
import { requireStudent } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase-server";
import VocabReview from "@/components/VocabReview";

export default async function VocabReviewPage() {
  const { profile } = await requireStudent();
  const supabase = createClient();

  const nowIso = new Date().toISOString();
  const { data: dueWords } = await supabase
    .from("user_vocab")
    .select("*")
    .eq("user_id", profile.id)
    .lte("next_review_at", nowIso)
    .order("next_review_at", { ascending: true })
    .limit(50);

  if (!dueWords || dueWords.length === 0) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-cream-50 border border-coffee-700/10 rounded-3xl p-10 text-center">
          <div className="text-5xl mb-3">🎉</div>
          <h1 className="font-display text-2xl font-semibold text-coffee-900 mb-1">
            All caught up
          </h1>
          <p className="text-coffee-600 mb-6">
            No words are due for review right now. Come back tomorrow, or add new ones.
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

  return <VocabReview userId={profile.id} dueWords={dueWords} />;
}
