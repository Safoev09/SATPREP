import { redirect } from "next/navigation";
import Link from "next/link";
import { requireStudent } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase-server";
import { getSkillLabel } from "@/lib/skills";
import ResultsReview from "@/components/ResultsReview";

export default async function ResultsPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const { profile } = await requireStudent();
  const supabase = createClient();

  const sessionId = parseInt(params.sessionId);
  if (isNaN(sessionId)) redirect("/app");

  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", profile.id)
    .single();

  if (!session) redirect("/app");
  if (session.status !== "completed") {
    redirect(`/app/practice/${sessionId}`);
  }

  // Load answers + their questions
  const { data: answers } = await supabase
    .from("answers")
    .select("*")
    .eq("session_id", sessionId)
    .order("id", { ascending: true });

  const questionIds = (answers ?? []).map((a) => a.question_id);
  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .in("id", questionIds.length > 0 ? questionIds : [-1]);

  // Load passages
  const passageIds = Array.from(
    new Set((questions ?? []).map((q) => q.passage_id).filter((id): id is number => id !== null))
  );
  let passages: Record<number, string> = {};
  if (passageIds.length > 0) {
    const { data: passageData } = await supabase
      .from("passages")
      .select("id, content")
      .in("id", passageIds);
    (passageData ?? []).forEach((p: { id: number; content: string }) => {
      passages[p.id] = p.content;
    });
  }

  // Which questions are bookmarked
  const { data: bookmarks } = await supabase
    .from("bookmarks")
    .select("question_id")
    .eq("user_id", profile.id);
  const bookmarkedIds = new Set((bookmarks ?? []).map((b) => b.question_id));

  const total = session.total_questions ?? 0;
  const correct = session.correct_count ?? 0;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

  const mins = Math.floor((session.time_spent_seconds ?? 0) / 60);
  const secs = (session.time_spent_seconds ?? 0) % 60;

  return (
    <div className="p-10 max-w-4xl">
      {/* Score header */}
      <div className="bg-coffee-800 text-cream-100 rounded-3xl p-8 mb-8">
        <div className="text-cream-200 text-sm uppercase tracking-wider mb-1">
          Drill complete · {getSkillLabel(session.skill)}
        </div>
        <div className="flex items-end gap-6 flex-wrap">
          <div>
            <div className="font-display text-6xl font-semibold text-cream-50">
              {correct}/{total}
            </div>
            <div className="text-cream-200 text-sm mt-1">{pct}% correct</div>
          </div>
          <div className="flex gap-6 mb-2">
            <div>
              <div className="text-2xl font-display font-semibold text-cream-50">{pct}%</div>
              <div className="text-xs text-cream-200">Accuracy</div>
            </div>
            <div>
              <div className="text-2xl font-display font-semibold text-cream-50">
                {mins}:{secs.toString().padStart(2, "0")}
              </div>
              <div className="text-xs text-cream-200">Time spent</div>
            </div>
          </div>
        </div>
      </div>

      {/* Encouragement */}
      <div className="mb-8">
        <p className="text-coffee-700">
          {pct >= 80
            ? "Excellent work — this skill is looking strong. 🎉"
            : pct >= 50
            ? "Good effort. Review the ones you missed below — that's where the score gains hide."
            : "This skill needs more practice. Read every explanation below carefully, then try another drill."}
        </p>
      </div>

      {/* Question-by-question review */}
      <h2 className="font-display text-2xl font-semibold text-coffee-900 mb-4">
        Review every question
      </h2>
      <ResultsReview
        answers={answers ?? []}
        questions={questions ?? []}
        passages={passages}
        initialBookmarks={Array.from(bookmarkedIds)}
      />

      {/* Actions */}
      <div className="flex gap-3 mt-8">
        <Link
          href={session.section === "math" ? "/app/math/drills" : "/app/rw/drills"}
          className="bg-coffee-800 hover:bg-coffee-900 text-cream-50 px-6 py-3 rounded-full font-medium text-sm"
        >
          Practice another drill →
        </Link>
        <Link
          href="/app"
          className="px-6 py-3 rounded-full font-medium text-sm text-coffee-700 hover:bg-cream-100"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
