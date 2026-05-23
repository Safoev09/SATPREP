import { requireStudent } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase-server";
import { daysUntil, SAT_EXAM_DATES } from "@/lib/exam-dates";
import { getSkillLabel } from "@/lib/skills";
import DashboardView from "@/components/DashboardView";

export default async function DashboardPage() {
  const { profile, email } = await requireStudent();
  const supabase = createClient();

  // Recent completed sessions
  const { data: recentSessions } = await supabase
    .from("sessions")
    .select("id, mode, skill, section, scaled_score, correct_count, total_questions, completed_at")
    .eq("user_id", profile.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(5);

  // Last diagnostic
  const { data: lastDiagnostic } = await supabase
    .from("sessions")
    .select("id, correct_count, total_questions")
    .eq("user_id", profile.id)
    .eq("mode", "diagnostic")
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Score history (modules + full tests with a scaled score)
  const scoredSessions = (recentSessions ?? []).filter((s) => s.scaled_score != null);

  // Accuracy by skill for the radar
  const { data: answers } = await supabase
    .from("answers")
    .select("is_correct, questions(skill, section)")
    .eq("user_id", profile.id);

  const bySkill: Record<string, { correct: number; total: number; section: string }> = {};
  (answers ?? []).forEach((a: any) => {
    const skill = a.questions?.skill;
    const section = a.questions?.section;
    if (!skill) return;
    if (!bySkill[skill]) bySkill[skill] = { correct: 0, total: 0, section };
    bySkill[skill].total++;
    if (a.is_correct) bySkill[skill].correct++;
  });

  const skillStats = Object.entries(bySkill).map(([skill, v]) => ({
    skill,
    label: getSkillLabel(skill),
    section: v.section as "reading_writing" | "math",
    pct: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
    total: v.total,
  }));

  const examDateDisplay =
    SAT_EXAM_DATES.find((d) => d.date === profile.target_exam_date)?.display ??
    profile.target_exam_date;
  const days = profile.target_exam_date ? daysUntil(profile.target_exam_date) : null;
  const firstName = profile.full_name?.split(" ")[0] ?? email.split("@")[0];

  const totalAnswered = answers?.length ?? 0;
  const totalCorrect = (answers ?? []).filter((a) => a.is_correct).length;

  return (
    <DashboardView
      firstName={firstName}
      targetScore={profile.target_score}
      previousScore={profile.previous_score}
      examDateDisplay={examDateDisplay}
      daysUntilExam={days}
      xp={profile.xp ?? 0}
      streak={profile.current_streak ?? 0}
      longestStreak={profile.longest_streak ?? 0}
      lastActivityDate={profile.last_activity_date ?? null}
      diagnosticDone={profile.diagnostic_completed}
      lastDiagnostic={lastDiagnostic ?? null}
      recentSessions={recentSessions ?? []}
      scoredSessions={scoredSessions}
      skillStats={skillStats}
      totalAnswered={totalAnswered}
      totalCorrect={totalCorrect}
    />
  );
}
