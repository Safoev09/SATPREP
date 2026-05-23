import { redirect } from "next/navigation";
import Link from "next/link";
import { requireStudent } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase-server";
import { scoreDiagnostic, type DiagnosticAnswer } from "@/lib/diagnostic-scoring";

export default async function FullTestResultsPage({
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
    .eq("mode", "full_test")
    .single();

  if (!session) redirect("/app");
  if (session.status !== "completed") {
    redirect(`/app/full-test/${sessionId}`);
  }

  // Load answers with their question skill/section for the breakdown
  const { data: answers } = await supabase
    .from("answers")
    .select("question_id, is_correct, questions(skill, section, difficulty)")
    .eq("session_id", sessionId);

  const diagAnswers: DiagnosticAnswer[] = (answers ?? []).map((a: any) => ({
    question_id: a.question_id,
    skill: a.questions?.skill ?? "",
    section: a.questions?.section ?? "reading_writing",
    difficulty: a.questions?.difficulty ?? "medium",
    is_correct: a.is_correct,
  }));

  // Reuse the diagnostic scorer for the skill breakdown
  const breakdown = scoreDiagnostic(diagAnswers);

  // The real 400-1600 score was computed and stored at submit time
  const totalScore = session.scaled_score ?? breakdown.totalScore;
  const gap = profile.target_score ? profile.target_score - totalScore : null;

  return (
    <div className="p-10 max-w-4xl">
      {/* Score hero */}
      <div className="bg-coffee-800 text-cream-100 rounded-3xl p-8 mb-8">
        <div className="text-cream-200 text-sm uppercase tracking-wider mb-1">
          Full mock test · complete
        </div>
        <div className="font-display text-7xl font-semibold text-cream-50 mb-1">
          {totalScore}
        </div>
        <div className="text-cream-200 text-sm mb-4">your score, out of 1600</div>
        <div className="flex gap-6 pt-4 border-t border-cream-100/15">
          <div>
            <div className="text-2xl font-display font-semibold text-cream-50">
              {breakdown.rwScore}
            </div>
            <div className="text-xs text-cream-200">Reading & Writing</div>
          </div>
          <div>
            <div className="text-2xl font-display font-semibold text-cream-50">
              {breakdown.mathScore}
            </div>
            <div className="text-xs text-cream-200">Math</div>
          </div>
          <div>
            <div className="text-2xl font-display font-semibold text-cream-50">
              {session.correct_count}/{session.total_questions}
            </div>
            <div className="text-xs text-cream-200">Questions correct</div>
          </div>
        </div>
        {gap !== null && (
          <div className="mt-4 pt-4 border-t border-cream-100/15 text-sm text-cream-200">
            {gap > 0 ? (
              <>That's <strong className="text-cream-50">{gap} points</strong> from your target of {profile.target_score}.</>
            ) : (
              <>🎉 You hit your target of {profile.target_score}!</>
            )}
          </div>
        )}
      </div>

      <div className="bg-cream-100 border border-coffee-700/10 rounded-xl p-4 mb-8 text-sm text-coffee-700">
        <strong>Note:</strong> This score is an estimate based on an adaptive practice test.
        Real SAT scores depend on College Board's official equating. Use this as a strong
        indicator of where you stand, not an exact prediction.
      </div>

      {/* Skill breakdown */}
      {breakdown.weaknesses.length > 0 && (
        <div className="mb-8">
          <h2 className="font-display text-2xl font-semibold text-coffee-900 mb-3">
            🎯 Skills to focus on
          </h2>
          <div className="space-y-2">
            {breakdown.weaknesses.slice(0, 6).map((s) => (
              <div key={s.skill} className="bg-red-50 border border-red-200 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <div className="font-medium text-coffee-900">{s.label}</div>
                  <div className="text-xs text-coffee-600">{s.domain}</div>
                </div>
                <div className="text-sm text-red-700 font-medium">{s.correct}/{s.total}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {breakdown.strengths.length > 0 && (
        <div className="mb-8">
          <h2 className="font-display text-2xl font-semibold text-coffee-900 mb-3">
            💪 Strong skills
          </h2>
          <div className="space-y-2">
            {breakdown.strengths.slice(0, 6).map((s) => (
              <div key={s.skill} className="bg-green-50 border border-green-200 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <div className="font-medium text-coffee-900">{s.label}</div>
                  <div className="text-xs text-coffee-600">{s.domain}</div>
                </div>
                <div className="text-sm text-green-700 font-medium">{s.correct}/{s.total}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Link
          href="/app/full-test"
          className="bg-coffee-800 hover:bg-coffee-900 text-cream-50 px-6 py-3 rounded-full font-medium text-sm"
        >
          Take another full test →
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
