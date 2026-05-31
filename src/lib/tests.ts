// Types for admin-built tests with adaptive Module 2.

export type Test = {
  id: number;
  title: string;
  description: string | null;
  test_type: "module" | "full";
  section: "reading_writing" | "math" | null;
  difficulty: "easy" | "medium" | "hard" | "mixed" | null;
  visibility: "free" | "premium";
  is_published: boolean;
  created_at: string;
  rw_hard_cutoff: number;
  math_hard_cutoff: number;
};

export type TestQuestion = {
  id: number;
  test_id: number;
  question_id: number;
  slot: string;
  position: number;
};

// Module test slots — single section, but M2 splits into easy / hard
export const MODULE_TEST_SLOTS = [
  { id: "module_m1",       label: "Module 1 (everyone takes this)",   tier: "m1"   as const },
  { id: "module_m2_easy",  label: "Module 2 — Easy (if M1 below cutoff)", tier: "m2_easy" as const },
  { id: "module_m2_hard",  label: "Module 2 — Hard (if M1 above cutoff)", tier: "m2_hard" as const },
] as const;

// Full test slots — both sections, each section's M2 splits into easy / hard
export const FULL_TEST_SLOTS = [
  { id: "rw_m1",        label: "R&W — Module 1",                section: "reading_writing" as const, tier: "m1" as const },
  { id: "rw_m2_easy",   label: "R&W — Module 2 Easy",           section: "reading_writing" as const, tier: "m2_easy" as const },
  { id: "rw_m2_hard",   label: "R&W — Module 2 Hard",           section: "reading_writing" as const, tier: "m2_hard" as const },
  { id: "math_m1",      label: "Math — Module 1",               section: "math" as const,            tier: "m1" as const },
  { id: "math_m2_easy", label: "Math — Module 2 Easy",          section: "math" as const,            tier: "m2_easy" as const },
  { id: "math_m2_hard", label: "Math — Module 2 Hard",          section: "math" as const,            tier: "m2_hard" as const },
] as const;

// Legacy: kept for old tests created before adaptive
export const MODULE_SLOT = "module";

// Helper — pick M2 tier based on M1 score
export function pickM2Tier(m1Correct: number, m1Total: number, hardCutoff: number): "easy" | "hard" {
  if (m1Total === 0) return "easy";
  const pct = (m1Correct / m1Total) * 100;
  return pct >= hardCutoff ? "hard" : "easy";
}
