// Types for admin-built tests

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
};

export type TestQuestion = {
  id: number;
  test_id: number;
  question_id: number;
  slot: string;
  position: number;
};

// Slots for a full SAT test
export const FULL_TEST_SLOTS = [
  { id: "rw_m1", label: "Reading & Writing — Module 1", section: "reading_writing" },
  { id: "rw_m2", label: "Reading & Writing — Module 2", section: "reading_writing" },
  { id: "math_m1", label: "Math — Module 1", section: "math" },
  { id: "math_m2", label: "Math — Module 2", section: "math" },
] as const;

export const MODULE_SLOT = "module";
