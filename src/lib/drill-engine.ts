import { createClient } from "@/lib/supabase-server";
import type { Question } from "@/lib/skills";

export type DrillConfig = {
  section: "reading_writing" | "math";
  skill: string;
  count: number;
  difficulty: "easy" | "medium" | "hard" | "mixed" | "adaptive";
  practiceMode: "practice" | "test";
  timeLimitSeconds: number | null; // null = untimed
  skipCorrect: boolean;
};

// Difficulty ramp order: easy first, hard last (per the spec)
const DIFF_ORDER: Record<string, number> = { easy: 0, medium: 1, hard: 2 };

export async function buildDrillQuestions(
  userId: string,
  config: DrillConfig
): Promise<Question[]> {
  const supabase = createClient();

  // Base query: published questions in this skill
  let query = supabase
    .from("questions")
    .select("*")
    .eq("section", config.section)
    .eq("skill", config.skill)
    .eq("is_published", true);

  // Difficulty filter (mixed and adaptive pull all difficulties)
  if (config.difficulty === "easy" || config.difficulty === "medium" || config.difficulty === "hard") {
    query = query.eq("difficulty", config.difficulty);
  }

  const { data: allQuestions, error } = await query;
  if (error || !allQuestions) return [];

  let pool = allQuestions as Question[];

  // Skip questions the student already answered correctly
  if (config.skipCorrect) {
    const { data: correctAnswers } = await supabase
      .from("answers")
      .select("question_id")
      .eq("user_id", userId)
      .eq("is_correct", true);

    const correctIds = new Set((correctAnswers ?? []).map((a) => a.question_id));
    pool = pool.filter((q) => !correctIds.has(q.id));
  }

  // Sort by difficulty ramp (easy -> hard), then by id for stable ordering
  pool.sort((a, b) => {
    const da = DIFF_ORDER[a.difficulty] ?? 1;
    const db = DIFF_ORDER[b.difficulty] ?? 1;
    if (da !== db) return da - db;
    return a.id - b.id;
  });

  // Take the requested count
  return pool.slice(0, config.count);
}

// Count how many questions are available for a given skill (for the setup screen)
export async function countAvailableQuestions(
  section: "reading_writing" | "math",
  skill: string
): Promise<number> {
  const supabase = createClient();
  const { count } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("section", section)
    .eq("skill", skill)
    .eq("is_published", true);
  return count ?? 0;
}

// Count available questions for every skill in a section at once
export async function countBySkill(
  section: "reading_writing" | "math"
): Promise<Record<string, number>> {
  const supabase = createClient();
  const { data } = await supabase
    .from("questions")
    .select("skill")
    .eq("section", section)
    .eq("is_published", true);

  const counts: Record<string, number> = {};
  (data ?? []).forEach((row: { skill: string }) => {
    counts[row.skill] = (counts[row.skill] ?? 0) + 1;
  });
  return counts;
}
