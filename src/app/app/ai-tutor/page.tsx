import { requireStudent } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase-server";
import AITutorChat from "@/components/AITutorChat";
import { getSkillLabel } from "@/lib/skills";

export default async function AITutorPage() {
  const { profile } = await requireStudent();
  const supabase = createClient();

  // Pull skill stats for context
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

  const skillStats = Object.entries(bySkill)
    .map(([skill, { correct, total, section }]) => ({
      skill,
      label: getSkillLabel(skill),
      section,
      pct: total > 0 ? Math.round((correct / total) * 100) : 0,
      total,
    }))
    .sort((a, b) => a.pct - b.pct);

  // Recent sessions
  const { data: recentSessions } = await supabase
    .from("sessions")
    .select("mode, skill, section, scaled_score, correct_count, total_questions, completed_at")
    .eq("user_id", profile.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(10);

  const studentContext = {
    firstName: profile.full_name?.split(" ")[0] ?? "Student",
    targetScore: profile.target_score,
    previousScore: profile.previous_score,
    xp: profile.xp ?? 0,
    streak: profile.current_streak ?? 0,
    examDate: profile.target_exam_date,
    weakestSkills: skillStats.slice(0, 5).map((s) => ({
      label: s.label,
      pct: s.pct,
      section: s.section,
    })),
    strongestSkills: skillStats.slice(-3).map((s) => ({
      label: s.label,
      pct: s.pct,
    })),
    totalAnswered: answers?.length ?? 0,
    totalCorrect: (answers ?? []).filter((a: any) => a.is_correct).length,
    recentSessions: (recentSessions ?? []).slice(0, 5).map((s) => ({
      mode: s.mode,
      skill: s.skill,
      section: s.section,
      score: s.scaled_score,
      correct: s.correct_count,
      total: s.total_questions,
    })),
  };

  return <AITutorChat studentContext={studentContext} />;
}
