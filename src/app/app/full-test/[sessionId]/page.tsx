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

  // Load the test's questions, grouped by slot, in order
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
    (qRows ?? []).forEach((q) => { questionsById[q.id] = q as Question; });
  }

  const slotQuestions = (slot: string): Question[] =>
    (tqRows ?? [])
      .filter((r) => r.slot === slot)
      .map((r) => questionsById[r.question_id])
      .filter(Boolean);

  const rwM1 = slotQuestions("rw_m1");
  const rwM2 = slotQuestions("rw_m2");
  const mathM1 = slotQuestions("math_m1");
  const mathM2 = slotQuestions("math_m2");

  if (rwM1.length === 0 && rwM2.length === 0 && mathM1.length === 0 && mathM2.length === 0) {
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
  const allQ = [...rwM1, ...rwM2, ...mathM1, ...mathM2];
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
      rwModule2={rwM2}
      mathModule1={mathM1}
      mathModule2={mathM2}
    />
  );
}
