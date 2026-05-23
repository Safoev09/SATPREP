import { createClient } from "@/lib/supabase-server";
import type { Test } from "@/lib/tests";

export type TestWithCount = Test & { question_count: number };

// Load published tests, optionally filtered by type/section, each with its question count.
export async function getPublishedTests(filter: {
  testType?: "module" | "full";
  section?: "reading_writing" | "math";
}): Promise<TestWithCount[]> {
  const supabase = createClient();

  let query = supabase
    .from("tests")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (filter.testType) query = query.eq("test_type", filter.testType);
  if (filter.section) query = query.eq("section", filter.section);

  const { data: tests } = await query;
  if (!tests || tests.length === 0) return [];

  // Count questions per test
  const testIds = tests.map((t) => t.id);
  const { data: tqRows } = await supabase
    .from("test_questions")
    .select("test_id")
    .in("test_id", testIds);

  const counts: Record<number, number> = {};
  (tqRows ?? []).forEach((r: { test_id: number }) => {
    counts[r.test_id] = (counts[r.test_id] ?? 0) + 1;
  });

  return tests.map((t) => ({
    ...t,
    question_count: counts[t.id] ?? 0,
  }));
}
