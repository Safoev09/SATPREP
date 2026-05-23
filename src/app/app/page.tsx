import Link from "next/link";
import { requireStudent } from "@/lib/auth-helpers";
import { daysUntil, SAT_EXAM_DATES } from "@/lib/exam-dates";
import { createClient } from "@/lib/supabase-server";

export default async function StudentDashboard() {
  const data = await requireStudent();
  const { profile, email } = data;
  const supabase = createClient();

  const examDateDisplay =
    SAT_EXAM_DATES.find((d) => d.date === profile.target_exam_date)?.display ??
    profile.target_exam_date;
  const days = profile.target_exam_date ? daysUntil(profile.target_exam_date) : null;
  const firstName = profile.full_name?.split(" ")[0] ?? email.split("@")[0];

  // Recent sessions for "Continue where you left off"
  const { data: recentSessions } = await supabase
    .from("sessions")
    .select("id, mode, skill, section, scaled_score, correct_count, total_questions, completed_at")
    .eq("user_id", profile.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(3);

  // Most recent diagnostic session (for the "current estimate" card)
  const { data: lastDiagnostic } = await supabase
    .from("sessions")
    .select("id, correct_count, total_questions")
    .eq("user_id", profile.id)
    .eq("mode", "diagnostic")
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="p-10 max-w-6xl">
      {/* Greeting */}
      <div className="mb-10">
        <h1 className="font-display text-4xl font-semibold text-coffee-900">
          Good to see you, {firstName} 👋
        </h1>
        <p className="text-coffee-600 mt-2">
          Let's get you closer to your target. One question at a time.
        </p>
      </div>

      {/* Top stat cards row */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {/* Target score */}
        <div className="bg-cream-100 rounded-2xl p-6 border border-coffee-700/10">
          <div className="text-xs text-coffee-600 uppercase tracking-wider mb-2">
            Target score
          </div>
          <div className="font-display text-4xl font-semibold text-coffee-900 mb-1">
            {profile.target_score}
          </div>
          <div className="text-sm text-coffee-600">
            {profile.previous_score
              ? `from your ${profile.previous_score} baseline`
              : "no previous score"}
          </div>
        </div>

        {/* Countdown */}
        <div className="bg-coffee-800 text-cream-100 rounded-2xl p-6">
          <div className="text-xs text-cream-200 uppercase tracking-wider mb-2">
            Exam day
          </div>
          <div className="font-display text-4xl font-semibold text-cream-50 mb-1">
            {days !== null && days > 0 ? `${days} days` : days === 0 ? "Today" : "Past"}
          </div>
          <div className="text-sm text-cream-200">{examDateDisplay}</div>
        </div>

        {/* Diagnostic estimate */}
        <div className="bg-cream-100 rounded-2xl p-6 border border-coffee-700/10">
          <div className="text-xs text-coffee-600 uppercase tracking-wider mb-2">
            Diagnostic result
          </div>
          {lastDiagnostic ? (
            <>
              <div className="font-display text-4xl font-semibold text-coffee-900 mb-1">
                {lastDiagnostic.correct_count}/{lastDiagnostic.total_questions}
              </div>
              <div className="text-sm text-coffee-600">
                <Link
                  href={`/app/diagnostic/results?session=${lastDiagnostic.id}`}
                  className="underline hover:text-coffee-900"
                >
                  See full breakdown →
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="font-display text-4xl font-semibold text-coffee-900 mb-1">
                —
              </div>
              <div className="text-sm text-coffee-600">
                <Link href="/app/diagnostic" className="underline hover:text-coffee-900">
                  Take diagnostic →
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Diagnostic call-to-action (only if not yet completed) */}
      {!profile.diagnostic_completed && (
        <div className="bg-cream-100 border-2 border-dashed border-beige-400 rounded-2xl p-6 mb-10 flex justify-between items-center">
          <div>
            <h2 className="font-display font-semibold text-xl text-coffee-900 mb-1">
              📋 Start with a quick diagnostic
            </h2>
            <p className="text-coffee-700 text-sm">
              30 minutes (15 Math + 15 R&W). We'll figure out your weak spots and personalize what to practice.
            </p>
          </div>
          <Link
            href="/app/diagnostic"
            className="bg-coffee-800 hover:bg-coffee-900 text-cream-50 px-6 py-3 rounded-full font-medium whitespace-nowrap"
          >
            Begin →
          </Link>
        </div>
      )}

      {/* Quick start cards */}
      <h2 className="font-display text-2xl font-semibold text-coffee-900 mb-4">
        Quick start
      </h2>
      <div className="grid grid-cols-2 gap-4 mb-10">
        <Link
          href="/app/rw/drills"
          className="bg-cream-50 border border-coffee-700/10 rounded-2xl p-7 hover:shadow-md hover:-translate-y-0.5 transition"
        >
          <div className="text-3xl mb-3">📖</div>
          <div className="font-display font-semibold text-xl text-coffee-900 mb-1">
            Reading & Writing drills
          </div>
          <div className="text-sm text-coffee-600">
            Transitions, Boundaries, Words in Context, and more — one skill at a time.
          </div>
        </Link>
        <Link
          href="/app/math/drills"
          className="bg-cream-50 border border-coffee-700/10 rounded-2xl p-7 hover:shadow-md hover:-translate-y-0.5 transition"
        >
          <div className="text-3xl mb-3">🧮</div>
          <div className="font-display font-semibold text-xl text-coffee-900 mb-1">
            Math drills
          </div>
          <div className="text-sm text-coffee-600">
            Algebra, Advanced Math, Geometry, Problem Solving — sharpen one at a time.
          </div>
        </Link>
      </div>

      {/* Recent activity */}
      <h2 className="font-display text-2xl font-semibold text-coffee-900 mb-4">
        Recent activity
      </h2>
      {recentSessions && recentSessions.length > 0 ? (
        <div className="bg-cream-50 border border-coffee-700/10 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream-100 text-coffee-700">
              <tr>
                <th className="text-left py-3 px-5">When</th>
                <th className="text-left py-3 px-5">Type</th>
                <th className="text-left py-3 px-5">Result</th>
              </tr>
            </thead>
            <tbody>
              {recentSessions.map((s) => (
                <tr key={s.id} className="border-t border-coffee-700/5">
                  <td className="py-3 px-5 text-coffee-700">
                    {new Date(s.completed_at!).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-5 text-coffee-800 capitalize">
                    {s.mode.replace("_", " ")}
                    {s.skill ? ` · ${s.skill}` : ""}
                  </td>
                  <td className="py-3 px-5 text-coffee-700">
                    {s.scaled_score
                      ? `${s.scaled_score}`
                      : `${s.correct_count}/${s.total_questions}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-cream-100 border border-coffee-700/10 rounded-2xl p-8 text-center text-coffee-600">
          No practice sessions yet — start a drill above to see your activity here.
        </div>
      )}
    </div>
  );
}
