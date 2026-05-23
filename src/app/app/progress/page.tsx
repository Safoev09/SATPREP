import Link from "next/link";
import { requireStudent } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase-server";
import { getSkillLabel, getSkillDomain } from "@/lib/skills";

export default async function ProgressPage() {
  const { profile } = await requireStudent();
  const supabase = createClient();

  // All answers, joined with question skill/section
  const { data: answers } = await supabase
    .from("answers")
    .select("is_correct, questions(skill, section)")
    .eq("user_id", profile.id);

  // All completed sessions
  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, mode, scaled_score, correct_count, total_questions, completed_at")
    .eq("user_id", profile.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false });

  const totalAnswered = answers?.length ?? 0;
  const totalCorrect = (answers ?? []).filter((a) => a.is_correct).length;
  const overallPct = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  const totalSessions = sessions?.length ?? 0;

  // Accuracy per skill
  const bySkill: Record<string, { correct: number; total: number }> = {};
  (answers ?? []).forEach((a: any) => {
    const skill = a.questions?.skill;
    if (!skill) return;
    if (!bySkill[skill]) bySkill[skill] = { correct: 0, total: 0 };
    bySkill[skill].total++;
    if (a.is_correct) bySkill[skill].correct++;
  });

  const skillRows = Object.entries(bySkill)
    .map(([skill, { correct, total }]) => ({
      skill,
      label: getSkillLabel(skill),
      domain: getSkillDomain(skill),
      correct,
      total,
      pct: total > 0 ? Math.round((correct / total) * 100) : 0,
    }))
    .sort((a, b) => a.pct - b.pct);

  // Score history (sessions with a scaled score — modules & full tests)
  const scoredSessions = (sessions ?? []).filter((s) => s.scaled_score != null);

  return (
    <div className="p-10 max-w-4xl">
      <h1 className="font-display text-3xl font-semibold text-coffee-900 mb-1">
        Your progress
      </h1>
      <p className="text-coffee-600 mb-8">
        Track your accuracy, spot your weak skills, and watch your scores climb.
      </p>

      {totalAnswered === 0 ? (
        <div className="bg-cream-50 border border-coffee-700/10 rounded-2xl p-12 text-center">
          <div className="text-5xl mb-3">📊</div>
          <p className="text-coffee-600 mb-4">
            No practice data yet. Once you complete drills and tests, your stats appear here.
          </p>
          <Link
            href="/app/rw/drills"
            className="text-coffee-700 hover:text-coffee-900 underline text-sm"
          >
            Start practising
          </Link>
        </div>
      ) : (
        <>
          {/* Overview cards */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            <div className="bg-cream-100 rounded-2xl p-5 border border-coffee-700/10">
              <div className="text-xs text-coffee-600 uppercase tracking-wider">Overall accuracy</div>
              <div className="font-display text-3xl font-semibold text-coffee-900 mt-1">
                {overallPct}%
              </div>
              <div className="text-xs text-coffee-600 mt-0.5">
                {totalCorrect} of {totalAnswered} correct
              </div>
            </div>
            <div className="bg-cream-100 rounded-2xl p-5 border border-coffee-700/10">
              <div className="text-xs text-coffee-600 uppercase tracking-wider">Questions practised</div>
              <div className="font-display text-3xl font-semibold text-coffee-900 mt-1">
                {totalAnswered}
              </div>
            </div>
            <div className="bg-cream-100 rounded-2xl p-5 border border-coffee-700/10">
              <div className="text-xs text-coffee-600 uppercase tracking-wider">Sessions completed</div>
              <div className="font-display text-3xl font-semibold text-coffee-900 mt-1">
                {totalSessions}
              </div>
            </div>
          </div>

          {/* Score history */}
          {scoredSessions.length > 0 && (
            <div className="mb-10">
              <h2 className="font-display text-2xl font-semibold text-coffee-900 mb-3">
                Score history
              </h2>
              <div className="bg-cream-50 border border-coffee-700/10 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-cream-100 text-coffee-700">
                    <tr>
                      <th className="text-left py-3 px-5">Date</th>
                      <th className="text-left py-3 px-5">Type</th>
                      <th className="text-left py-3 px-5">Score</th>
                      <th className="text-left py-3 px-5">Correct</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scoredSessions.map((s) => (
                      <tr key={s.id} className="border-t border-coffee-700/5">
                        <td className="py-3 px-5 text-coffee-700">
                          {s.completed_at ? new Date(s.completed_at).toLocaleDateString() : "—"}
                        </td>
                        <td className="py-3 px-5 text-coffee-800 capitalize">
                          {s.mode.replace("_", " ")}
                        </td>
                        <td className="py-3 px-5 font-display font-semibold text-coffee-900">
                          {s.scaled_score}
                        </td>
                        <td className="py-3 px-5 text-coffee-700">
                          {s.correct_count}/{s.total_questions}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Skill accuracy bars */}
          <div className="mb-10">
            <h2 className="font-display text-2xl font-semibold text-coffee-900 mb-3">
              Accuracy by skill
            </h2>
            <p className="text-coffee-600 text-sm mb-4">
              Sorted weakest first — the top of this list is where to focus.
            </p>
            <div className="bg-cream-50 border border-coffee-700/10 rounded-2xl p-5 space-y-3">
              {skillRows.map((s) => {
                const barColor =
                  s.pct >= 75 ? "bg-green-500" : s.pct >= 50 ? "bg-yellow-500" : "bg-red-500";
                return (
                  <div key={s.skill}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-coffee-900 font-medium">{s.label}</span>
                      <span className="text-coffee-600">
                        {s.pct}% ({s.correct}/{s.total})
                      </span>
                    </div>
                    <div className="h-2.5 bg-cream-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barColor} rounded-full`}
                        style={{ width: `${s.pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weakest skills callout */}
          {skillRows.length > 0 && skillRows[0].pct < 75 && (
            <div className="bg-coffee-800 text-cream-100 rounded-2xl p-6">
              <h2 className="font-display font-semibold text-xl text-cream-50 mb-2">
                Suggested focus
              </h2>
              <p className="text-cream-200 text-sm mb-4">
                Drilling <strong className="text-cream-50">{skillRows[0].label}</strong> ({skillRows[0].pct}% accuracy)
                will likely move your score the most.
              </p>
              <Link
                href={
                  getSkillDomain(skillRows[0].skill) &&
                  ["Algebra", "Advanced Math", "Problem Solving & Data Analysis", "Geometry & Trigonometry"].includes(
                    getSkillDomain(skillRows[0].skill) ?? ""
                  )
                    ? "/app/math/drills"
                    : "/app/rw/drills"
                }
                className="inline-block bg-cream-50 text-coffee-900 px-5 py-2.5 rounded-full text-sm font-medium hover:bg-cream-100"
              >
                Practise this skill →
              </Link>
            </div>
          )}
        </>
      )}

      <div className="mt-8">
        <Link href="/app" className="text-coffee-700 hover:text-coffee-900 text-sm">
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}
