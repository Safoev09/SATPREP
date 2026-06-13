import { requireStudent } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase-server";
import { getSkillLabel, getSkillDomain } from "@/lib/skills";
import { computeMistakeDNA } from "@/lib/mistake-dna";
import ScoreMapView from "@/components/ScoreMapView";

export default async function ProgressPage() {
  const { profile } = await requireStudent();
  const supabase = createClient();

  // Fetch answers — only columns that actually exist in the answers table
  const { data: rawAnswers } = await supabase
    .from("answers")
    .select("question_id, is_correct, time_spent_seconds, flagged_for_review, was_changed, was_skipped, created_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(500);

  // Fetch question metadata separately (skill, section, difficulty definitely exist here)
  const questionIds = [...new Set((rawAnswers ?? []).map((a: any) => a.question_id))];

  const { data: questionMeta } = questionIds.length > 0
    ? await supabase
        .from("questions")
        .select("id, skill, section, difficulty")
        .in("id", questionIds)
    : { data: [] };

  // Build a lookup map
  const qMap = Object.fromEntries(
    (questionMeta ?? []).map((q: any) => [q.id, q])
  );

  // Merge answer + question metadata
  const mergedAnswers = (rawAnswers ?? []).map((a: any) => ({
    is_correct: a.is_correct,
    time_spent_seconds: a.time_spent_seconds ?? null,
    was_changed: a.was_changed ?? false,
    was_skipped: a.was_skipped ?? false,
    flagged_for_review: a.flagged_for_review ?? false,
    difficulty: qMap[a.question_id]?.difficulty ?? null,
    section: qMap[a.question_id]?.section ?? null,
    skill: qMap[a.question_id]?.skill ?? null,
    created_at: a.created_at,
  }));

  // Weekly answers
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const weeklyAnswers = mergedAnswers.filter(a => a.created_at && a.created_at >= weekAgo);

  // Compute DNA
  const dna = computeMistakeDNA(mergedAnswers, profile.previous_score, weeklyAnswers);

  // Skill stats
  const bySkill: Record<string, { correct: number; total: number; recent: number; recentCorrect: number }> = {};
  mergedAnswers.forEach((a, idx) => {
    const skill = a.skill;
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
    trend: v.recent >= 3
      ? Math.round((v.recentCorrect / v.recent) * 100) - Math.round((v.correct / v.total) * 100)
      : 0,
  })).sort((a, b) => a.pct - b.pct);

  // Sessions
  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, mode, scaled_score, correct_count, total_questions, completed_at")
    .eq("user_id", profile.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(20);

  // Weekly snapshots
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
