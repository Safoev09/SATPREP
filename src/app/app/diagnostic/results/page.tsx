import { redirect } from "next/navigation";
import Link from "next/link";
import { requireStudent } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase-server";
import { scoreDiagnostic, type DiagnosticAnswer } from "@/lib/diagnostic-scoring";

export default async function DiagnosticResultsPage({
  searchParams,
}: {
  searchParams: { session?: string };
}) {
  const { profile } = await requireStudent();
  const supabase = createClient();

  const sessionId = searchParams.session ? parseInt(searchParams.session) : null;
  if (!sessionId) redirect("/app");

  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", profile.id)
    .eq("mode", "diagnostic")
    .single();

  if (!session) redirect("/app");

  // Load answers joined with question skill/section/difficulty
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

  const result = scoreDiagnostic(diagAnswers);
  const gap = profile.target_score ? profile.target_score - result.totalScore : null;

  return (
    <div className="p-10 max-w-4xl">
      {/* Score hero */}
      <div className="bg-coffee-800 text-cream-100 rounded-3xl p-8 mb-8">
        <div className="text-cream-200 text-sm uppercase tracking-wider mb-1">
          Your diagnostic result
        </div>
        <div className="flex items-end gap-8 flex-wrap">
          <div>
            <div className="font-display text-6xl font-semibold text-cream-50">
              {result.totalScore}
            </div>
            <div className="text-cream-200 text-sm mt-1">estimated SAT score (400–1600)</div>
          </div>
          <div className="flex gap-6 mb-2">
            <div>
              <div className="text-3xl font-display font-semibold text-cream-50">
                {result.rwScore}
              </div>
              <div className="text-xs text-cream-200">Reading & Writing</div>
            </div>
            <div>
              <div className="text-3xl font-display font-semibold text-cream-50">
                {result.mathScore}
              </div>
              <div className="text-xs text-cream-200">Math</div>
            </div>
          </div>
        </div>
        {gap !== null && (
          <div className="mt-5 pt-5 border-t border-cream-100/15 text-sm text-cream-200">
            {gap > 0 ? (
              <>Your target is <strong className="text-cream-50">{profile.target_score}</strong> — that's <strong className="text-cream-50">{gap} points</strong> to go. Very doable with focused practice.</>
            ) : (
              <>You're already at or above your target of <strong className="text-cream-50">{profile.target_score}</strong>. Consider aiming higher!</>
            )}
          </div>
        )}
      </div>

      {/* Honest disclaimer */}
      <div className="bg-cream-100 border border-coffee-700/10 rounded-xl p-4 mb-8 text-sm text-coffee-700">
        <strong>How to read this:</strong> This is a quick {result.rwTotal + result.mathTotal}-question
        diagnostic, so the score is a rough estimate, not an official prediction. Its real value is the
        skill breakdown below — that's what tells you where to spend your time.
      </div>

      {/* Section summary */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-cream-50 border border-coffee-700/10 rounded-2xl p-5">
          <div className="text-xs text-coffee-600 uppercase tracking-wider">Reading & Writing</div>
          <div className="font-display text-2xl font-semibold text-coffee-900 mt-1">
            {result.rwCorrect} / {result.rwTotal} correct
          </div>
        </div>
        <div className="bg-cream-50 border border-coffee-700/10 rounded-2xl p-5">
          <div className="text-xs text-coffee-600 uppercase tracking-wider">Math</div>
          <div className="font-display text-2xl font-semibold text-coffee-900 mt-1">
            {result.mathCorrect} / {result.mathTotal} correct
          </div>
        </div>
      </div>

      {/* Focus areas */}
      {result.weaknesses.length > 0 && (
        <div className="mb-8">
          <h2 className="font-display text-2xl font-semibold text-coffee-900 mb-3">
            🎯 Focus here first
          </h2>
          <p className="text-coffee-600 text-sm mb-4">
            These skills had the lowest accuracy. Drilling them will move your score the most.
          </p>
          <div className="space-y-2">
            {result.weaknesses.map((s) => (
              <div key={s.skill} className="bg-red-50 border border-red-200 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <div className="font-medium text-coffee-900">{s.label}</div>
                  <div className="text-xs text-coffee-600">{s.domain}</div>
                </div>
                <div className="text-sm text-red-700 font-medium">
                  {s.correct}/{s.total} correct
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths */}
      {result.strengths.length > 0 && (
        <div className="mb-8">
          <h2 className="font-display text-2xl font-semibold text-coffee-900 mb-3">
            💪 Your strengths
          </h2>
          <div className="space-y-2">
            {result.strengths.map((s) => (
              <div key={s.skill} className="bg-green-50 border border-green-200 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <div className="font-medium text-coffee-900">{s.label}</div>
                  <div className="text-xs text-coffee-600">{s.domain}</div>
                </div>
                <div className="text-sm text-green-700 font-medium">
                  {s.correct}/{s.total} correct
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full skill table */}
      <div className="mb-8">
        <h2 className="font-display text-2xl font-semibold text-coffee-900 mb-3">
          Every skill tested
        </h2>
        <div className="bg-cream-50 border border-coffee-700/10 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream-100 text-coffee-700">
              <tr>
                <th className="text-left py-3 px-5">Skill</th>
                <th className="text-left py-3 px-5">Domain</th>
                <th className="text-left py-3 px-5">Score</th>
                <th className="text-left py-3 px-5">Rating</th>
              </tr>
            </thead>
            <tbody>
              {result.skillResults.map((s) => (
                <tr key={s.skill} className="border-t border-coffee-700/5">
                  <td className="py-3 px-5 text-coffee-900 font-medium">{s.label}</td>
                  <td className="py-3 px-5 text-coffee-600">{s.domain}</td>
                  <td className="py-3 px-5 text-coffee-700">{s.correct}/{s.total}</td>
                  <td className="py-3 px-5">
                    <RatingPill rating={s.rating} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Next steps */}
      <div className="bg-coffee-800 text-cream-100 rounded-2xl p-6 mb-8">
        <h2 className="font-display font-semibold text-xl text-cream-50 mb-2">
          Your next step
        </h2>
        <p className="text-cream-200 text-sm mb-4">
          {result.weaknesses.length > 0
            ? `Start with a drill on "${result.weaknesses[0].label}" — your weakest skill. Then work down the focus list.`
            : "You did well across the board! Keep practising with mixed drills and try a full module."}
        </p>
        <div className="flex gap-3 flex-wrap">
          <Link
            href="/app/rw/drills"
            className="bg-cream-50 text-coffee-900 px-5 py-2.5 rounded-full text-sm font-medium hover:bg-cream-100"
          >
            R&W drills →
          </Link>
          <Link
            href="/app/math/drills"
            className="bg-cream-50 text-coffee-900 px-5 py-2.5 rounded-full text-sm font-medium hover:bg-cream-100"
          >
            Math drills →
          </Link>
        </div>
      </div>

      <Link href="/app" className="text-coffee-700 hover:text-coffee-900 text-sm">
        ← Back to dashboard
      </Link>
    </div>
  );
}

function RatingPill({ rating }: { rating: "strong" | "okay" | "weak" }) {
  const styles = {
    strong: "bg-green-100 text-green-800",
    okay: "bg-yellow-100 text-yellow-800",
    weak: "bg-red-100 text-red-800",
  };
  const labels = { strong: "Strong", okay: "Okay", weak: "Needs work" };
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full ${styles[rating]}`}>
      {labels[rating]}
    </span>
  );
}
