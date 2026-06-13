import { requireStudent } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase-server";
import { getSkillLabel, getSkillDomain } from "@/lib/skills";
import { computeMistakeDNA } from "@/lib/mistake-dna";
import ScoreMapView from "@/components/ScoreMapView";

export default async function ProgressPage() {
  const { profile } = await requireStudent();
  const supabase = createClient();

  // All answers with full data for DNA
  const { data: allAnswers } = await supabase
    .from("answers")
    .select(`
      is_correct,
      time_spent_seconds,
      was_changed,
      was_skipped,
      flagged_for_review,
      difficulty,
      section,
      skill,
      questions(skill, section, difficulty)
    `)
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(500);

  // Weekly answers (last 7 days)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: weeklyAnswers } = await supabase
    .from("answers")
    .select("is_correct, time_spent_seconds, was_changed, was_skipped, difficulty, section, skill, questions(skill, section, difficulty)")
    .eq("user_id", profile.id)
    .gte("created_at", weekAgo);

  // Normalise — join questions data into answer rows
  const normalise = (raw: any[]) => raw.map((a: any) => ({
    is_correct: a.is_correct,
    time_spent_seconds: a.time_spent_seconds ?? null,
    was_changed: a.was_changed ?? false,
    was_skipped: a.was_skipped ?? false,
    flagged_for_review: a.flagged_for_review ?? false,
    difficulty: a.difficulty ?? a.questions?.difficulty ?? null,
    section: a.section ?? a.questions?.section ?? null,
    skill: a.skill ?? a.questions?.skill ?? null,
  }));

  const normalAnswers = normalise(allAnswers ?? []);
  const normalWeekly = normalise(weeklyAnswers ?? []);

  // Compute DNA
  const dna = computeMistakeDNA(normalAnswers, profile.previous_score, normalWeekly);

  // Skill stats for accuracy bars
  const bySkill: Record<string, { correct: number; total: number; recent: number; recentCorrect: number }> = {};
  (allAnswers ?? []).forEach((a: any, idx: number) => {
    const skill = a.skill ?? a.questions?.skill;
    if (!skill) return;
    if (!bySkill[skill]) bySkill[skill] = { correct: 0, total: 0, recent: 0, recentCorrect: 0 };
    bySkill[skill].total++;
    if (a.is_correct) bySkill[skill].correct++;
    if (idx < 30) {
      bySkill[skill].recent++;
      if (a.is_correct) bySkill[skill].recentCorrect++;
    }
  });

  const skillRows = Object.entries(bySkill).map(([skill, v]) => ({
    skill,
    label: getSkillLabel(skill),
    domain: getSkillDomain(skill) ?? "",
    correct: v.correct,
    total: v.total,
    pct: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
    trend: v.recent >= 3 ? Math.round((v.recentCorrect / v.recent) * 100) - Math.round((v.correct / v.total) * 100) : 0,
  })).sort((a, b) => a.pct - b.pct);

  // Sessions
  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, mode, scaled_score, correct_count, total_questions, completed_at")
    .eq("user_id", profile.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(20);

  // Weekly snapshots for trend chart
  const { data: snapshots } = await supabase
    .from("dna_weekly_snapshots")
    .select("week_start, accuracy, xp_earned, sessions")
    .eq("user_id", profile.id)
    .order("week_start", { ascending: true })
    .limit(8);

  return (
    <ScoreMapView
      dna={dna}
      skillRows={skillRows}
      sessions={sessions ?? []}
      snapshots={snapshots ?? []}
      userName={profile.full_name?.split(" ")[0] ?? "Student"}
      targetScore={profile.target_score}
      previousScore={profile.previous_score}
    />
  );
}
