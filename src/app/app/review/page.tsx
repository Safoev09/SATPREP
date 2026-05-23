import Link from "next/link";
import { requireStudent } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase-server";
import ReviewQueueList from "@/components/ReviewQueueList";
import type { Question } from "@/lib/skills";

export default async function ReviewQueuePage() {
  const { profile } = await requireStudent();
  const supabase = createClient();

  // Load bookmarks (newest first)
  const { data: bookmarks } = await supabase
    .from("bookmarks")
    .select("question_id, created_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  const questionIds = (bookmarks ?? []).map((b) => b.question_id);

  let questions: Question[] = [];
  let passages: Record<number, string> = {};

  if (questionIds.length > 0) {
    const { data: qRows } = await supabase
      .from("questions")
      .select("*")
      .in("id", questionIds);
    // Preserve bookmark order (newest first)
    const byId: Record<number, Question> = {};
    (qRows ?? []).forEach((q) => { byId[q.id] = q as Question; });
    questions = questionIds.map((id) => byId[id]).filter(Boolean);

    const passageIds = Array.from(
      new Set(questions.map((q) => q.passage_id).filter((id): id is number => id !== null))
    );
    if (passageIds.length > 0) {
      const { data: passageData } = await supabase
        .from("passages")
        .select("id, content")
        .in("id", passageIds);
      (passageData ?? []).forEach((p: { id: number; content: string }) => {
        passages[p.id] = p.content;
      });
    }
  }

  return (
    <div className="p-10 max-w-4xl">
      <h1 className="font-display text-3xl font-semibold text-coffee-900 mb-1">
        Review queue
      </h1>
      <p className="text-coffee-600 mb-8">
        Every question you've saved for later. Work through them, then remove the ones you've mastered.
      </p>

      {questions.length === 0 ? (
        <div className="bg-cream-50 border border-coffee-700/10 rounded-2xl p-12 text-center">
          <div className="text-5xl mb-3">🔖</div>
          <p className="text-coffee-600 mb-4">
            Your review queue is empty. While practising, tap{" "}
            <strong>"Save for later"</strong> on any question to add it here.
          </p>
          <Link
            href="/app/rw/drills"
            className="text-coffee-700 hover:text-coffee-900 underline text-sm"
          >
            Start a drill
          </Link>
        </div>
      ) : (
        <ReviewQueueList questions={questions} passages={passages} />
      )}

      <div className="mt-8">
        <Link href="/app" className="text-coffee-700 hover:text-coffee-900 text-sm">
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}
