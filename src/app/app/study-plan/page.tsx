import { requireStudent } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase-server";
import { daysUntil } from "@/lib/exam-dates";
import { getSkillLabel } from "@/lib/skills";
import { generateAdaptivePlan, type SkillStat } from "@/lib/study-plan";
import StudyPlanView from "@/components/StudyPlanView";

export default async function StudyPlanPage() {
  const { profile } = await requireStudent();
  const supabase = createClient();

  // Fetch answers with trend data (last 200 answers)
  const { data: answers } = await supabase
    .from("answers")
    .select("is_correct, created_at, questions(skill, section)")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(200);

  // Build skill stats with trend (recent 10 vs overall)
  const bySkill: Record<string, {
    correct: number; total: number; section: string;
    recent: { correct: number; total: number };
  }> = {};

  (answers ?? []).forEach((a: any, idx: number) => {
    const skill = a.questions?.skill;
    const section = a.questions?.section;
    if (!skill) return;
    if (!bySkill[skill]) bySkill[skill] = {
      correct: 0, total: 0, section,
      recent: { correct: 0, total: 0 },
    };
    bySkill[skill].total++;
    if (a.is_correct) bySkill[skill].correct++;
    // First 10 = most recent
    if (idx < 10) {
      bySkill[skill].recent.total++;
      if (a.is_correct) bySkill[skill].recent.correct++;
    }
  });

  const skillStats: SkillStat[] = Object.entries(bySkill).map(([skill, v]) => {
    const pct = v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0;
    const recentPct = v.recent.total >= 3
      ? Math.round((v.recent.correct / v.recent.total) * 100) : pct;
    return {
      skill,
      label: getSkillLabel(skill),
      section: v.section as "reading_writing" | "math",
      pct,
      total: v.total,
      recentPct,
      trend: v.recent.total >= 3 ? recentPct - pct : 0,
    };
  });

  // Vocab due
  const nowIso = new Date().toISOString();
  const { count: vocabDue } = await supabase
    .from("user_vocab")
    .select("*", { count: "exact", head: true })
    .eq("user_id", profile.id)
    .lte("next_review_at", nowIso);

  // Session count for plan versioning
  const { count: sessionCount } = await supabase
    .from("sessions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", profile.id)
    .eq("status", "completed");

  const days = profile.target_exam_date ? daysUntil(profile.target_exam_date) : null;

  const plan = generateAdaptivePlan({
    days,
    diagnosticDone: profile.diagnostic_completed,
    skillStats,
    vocabDue: vocabDue ?? 0,
    streak: profile.current_streak ?? 0,
    totalAnswered: answers?.length ?? 0,
    previousScore: profile.previous_score,
    targetScore: profile.target_score,
    sessionCount: sessionCount ?? 0,
  });

  return (
    <StudyPlanView
      plan={plan}
      skillStats={skillStats}
      userName={profile.full_name?.split(" ")[0] ?? "Student"}
    />
  );
}
