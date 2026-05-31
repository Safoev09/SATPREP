import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase-server";
import FullTestRunner from "@/components/FullTestRunner";
import type { Question } from "@/lib/skills";

export default async function FullTestRunPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const { profile } = await requireStudent();
  const supabase = createClient();

  const sessionId = parseInt(params.sessionId);
  if (isNaN(sessionId)) redirect("/app");

  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", profile.id)
    .eq("mode", "full_test")
    .single();

  if (!session) redirect("/app");
  if (session.status === "completed") {
    redirect(`/app/full-test/${sessionId}/results`);
  }
  if (!session.test_id) redirect("/app/full-test");

  // Load the test (for cutoffs) + its questions
  const { data: test } = await supabase
    .from("tests")
    .select("rw_hard_cutoff, math_hard_cutoff")
    .eq("id", session.test_id)
    .single();

  const { data: tqRows } = await supabase
    .from("test_questions")
    .select("question_id, slot, position")
    .eq("test_id", session.test_id)
    .order("position", { ascending: true });

  const allIds = (tqRows ?? []).map((r) => r.question_id);
  let questionsById: Record<number, Question> = {};
  if (allIds.length > 0) {
    const { data: qRows } = await supabase
      .from("questions")
      .select("*")
      .in("id", allIds);
    (qRows ?? []).forEach((q) => {
      questionsById[q.id] = q as Question;
    });
  }

  const slotQuestions = (slot: string): Question[] =>
    (tqRows ?? [])
      .filter((r) => r.slot === slot)
      .map((r) => questionsById[r.question_id])
      .filter(Boolean);

  const rwM1 = slotQuestions("rw_m1");
  // Adaptive: prefer easy/hard tiered slots; fall back to legacy rw_m2 if present
  const rwM2Easy = slotQuestions("rw_m2_easy");
  const rwM2Hard = slotQuestions("rw_m2_hard");
  const rwM2Legacy = slotQuestions("rw_m2");
  const mathM1 = slotQuestions("math_m1");
  const mathM2Easy = slotQuestions("math_m2_easy");
  const mathM2Hard = slotQuestions("math_m2_hard");
  const mathM2Legacy = slotQuestions("math_m2");

  const hasAnyQuestions =
    rwM1.length > 0 ||
    rwM2Easy.length > 0 ||
    rwM2Hard.length > 0 ||
    rwM2Legacy.length > 0 ||
    mathM1.length > 0 ||
    mathM2Easy.length > 0 ||
    mathM2Hard.length > 0 ||
    mathM2Legacy.length > 0;

  if (!hasAnyQuestions) {
    return (
      <div className="p-10 max-w-2xl">
        <div className="bg-cream-50 border border-coffee-700/10 rounded-2xl p-10 text-center">
          <div className="text-5xl mb-4">📭</div>
          <h1 className="font-display text-2xl font-semibold text-coffee-900 mb-2">
            This test has no questions yet
          </h1>
          <p className="text-coffee-600 mb-6">
            The site owner needs to add questions to each module slot in the admin panel.
          </p>
          <a
            href="/app/full-test"
            className="inline-block bg-coffee-800 hover:bg-coffee-900 text-cream-50 px-6 py-2.5 rounded-full text-sm font-medium"
          >
            ← Back to tests
          </a>
        </div>
      </div>
    );
  }

  // Load passages
  const allQ = [
    ...rwM1, ...rwM2Easy, ...rwM2Hard, ...rwM2Legacy,
    ...mathM1, ...mathM2Easy, ...mathM2Hard, ...mathM2Legacy,
  ];
  const passageIds = Array.from(
    new Set(allQ.map((q) => q.passage_id).filter((id): id is number => id !== null))
  );
  let passages: Record<number, string> = {};
  if (passageIds.length > 0) {
    const { data: passageData } = await supabase
      .from("passages")
      .select("id, content")
      .in("id", passageIds);
    (passageData ?? []).forEach((p: { id: number; content: string }) => {
      passages[p.id] = p.content;
    });
  }

  return (
    <FullTestRunner
      sessionId={sessionId}
      passages={passages}
      rwModule1={rwM1}
      rwModule2Easy={rwM2Easy.length > 0 ? rwM2Easy : rwM2Legacy}
      rwModule2Hard={rwM2Hard.length > 0 ? rwM2Hard : rwM2Legacy}
      mathModule1={mathM1}
      mathModule2Easy={mathM2Easy.length > 0 ? mathM2Easy : mathM2Legacy}
      mathModule2Hard={mathM2Hard.length > 0 ? mathM2Hard : mathM2Legacy}
      rwHardCutoff={test?.rw_hard_cutoff ?? 70}
      mathHardCutoff={test?.math_hard_cutoff ?? 70}
    />
  );
}
