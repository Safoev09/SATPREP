import { requireStudent } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase-server";
import { getSkillLabel, getSkillDomain } from "@/lib/skills";
import { computeMistakeDNA } from "@/lib/mistake-dna";
import ScoreMapView from "@/components/ScoreMapView";

export default async function ProgressPage() {
  const { profile } = await requireStudent();
  const supabase = createClient();

  // Step 1: fetch answers with ONLY columns that exist in the answers table
  const { data: rawAnswers } = await supabase
    .from("answers")
    .select("question_id, is_correct, time_spent_seconds, flagged_for_review, created_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(500);

  // Step 2: fetch question metadata separately (skill/section/difficulty are on questions table)
  const qIds = [...new Set((rawAnswers ?? []).map((a: any) => a.question_id).filter(Boolean))];
  const { data: qMeta } = qIds.length > 0
    ? await supabase.from("questions").select("id, skill, section, difficulty").in("id", qIds)
    : { data: [] };

  const qMap: Record<number, { skill: string; section: string; difficulty: string }> =
    Object.fromEntries((qMeta ?? []).map((q: any) => [q.id, q]));

  // Step 3: merge
  const mergedAnswers = (rawAnswers ?? []).map((a: any) => ({
    is_correct: a.is_correct ?? false,
    time_spent_seconds: a.time_spent_seconds ?? null,
    was_changed: false,
    was_skipped: false,
    flagged_for_review: a.flagged_for_review ?? false,
    difficulty: qMap[a.question_id]?.difficulty ?? null,
    section: qMap[a.question_id]?.section ?? null,
    skill: qMap[a.question_id]?.skill ?? null,
    created_at: a.created_at,
  }));

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const weeklyAnswers = mergedAnswers.filter(a => a.created_at >= weekAgo);

  // Compute DNA
  const dna = computeMistakeDNA(mergedAnswers, profile.previous_score, weeklyAnswers);

  // Skill stats
  const bySkill: Record<string, { correct: number; total: number; recentCorrect: number; recent: number }> = {};
  mergedAnswers.forEach((a, idx) => {
    if (!a.skill) return;
    if (!bySkill[a.skill]) bySkill[a.skill] = { correct: 0, total: 0, recentCorrect: 0, recent: 0 };
    bySkill[a.skill].total++;
    if (a.is_correct) bySkill[a.skill].correct++;
    if (idx < 30) {
      bySkill[a.skill].recent++;
      if (a.is_correct) bySkill[a.skill].recentCorrect++;
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

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, mode, scaled_score, correct_count, total_questions, completed_at")
    .eq("user_id", profile.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(20);

  const { data: snapshots } = await supabase
    .from("dna_weekly_snapshots")
    .select("week_start, accuracy, xp_earned, sessions")
    .eq("user_id", profile.id)
    .order("week_start", { ascending: true })
    .limit(8)
    .maybeSingle().then(() => ({ data: [] }))
    .catch(() => ({ data: [] }));

  return (
    <ScoreMapView
      dna={dna}
      skillRows={skillRows}
      sessions={sessions ?? []}
      snapshots={[]}
      userName={profile.full_name?.split(" ")[0] ?? "Student"}
      targetScore={profile.target_score}
      previousScore={profile.previous_score}
    />
  );
}
