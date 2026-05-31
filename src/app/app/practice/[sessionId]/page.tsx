import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase-server";
import { buildDrillQuestions, type DrillConfig } from "@/lib/drill-engine";
import { MATH_MODULE_MINUTES, RW_MODULE_MINUTES } from "@/lib/sat-scoring";
import PracticeRunner from "@/components/PracticeRunner";
import type { Question } from "@/lib/skills";

export default async function PracticePage({
  params,
  searchParams,
}: {
  params: { sessionId: string };
  searchParams: {
    count?: string;
    difficulty?: string;
    skipCorrect?: string;
    timeLimit?: string;
    fromTest?: string;
  };
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
    .single();

  if (!session) redirect("/app");
  if (session.status === "completed") {
    redirect(`/app/practice/${sessionId}/results`);
  }

  const isModule = session.mode === "module";
  let questions: Question[] = [];
  let timeLimitSeconds: number | null = null;

  if (isModule && session.test_id) {
    // Module from an admin-built test: load its M1 questions in order.
    // (Adaptive M2 for standalone modules is coming in a future update — for now,
    //  the module slot from older tests and `module_m1` from new tests both work.)
    const { data: tqRows } = await supabase
      .from("test_questions")
      .select("question_id, position, slot")
      .eq("test_id", session.test_id)
      .in("slot", ["module", "module_m1"])
      .order("position", { ascending: true });

    const orderedIds = (tqRows ?? []).map((r) => r.question_id);
    if (orderedIds.length > 0) {
      const { data: qRows } = await supabase
        .from("questions")
        .select("*")
        .in("id", orderedIds);
      // Preserve the admin-defined order
      const byId: Record<number, Question> = {};
      (qRows ?? []).forEach((q) => { byId[q.id] = q as Question; });
      questions = orderedIds.map((id) => byId[id]).filter(Boolean);
    }
    timeLimitSeconds =
      (session.section === "math" ? MATH_MODULE_MINUTES : RW_MODULE_MINUTES) * 60;
  } else {
    // Drill: auto-generate from the bank
    const config: DrillConfig = {
      section: session.section,
      skill: session.skill,
      count: parseInt(searchParams.count ?? "10"),
      difficulty: (searchParams.difficulty as DrillConfig["difficulty"]) ?? "mixed",
      practiceMode: session.practice_mode ?? "practice",
      timeLimitSeconds:
        searchParams.timeLimit && searchParams.timeLimit !== "0"
          ? parseInt(searchParams.timeLimit)
          : null,
      skipCorrect: searchParams.skipCorrect === "1",
    };
    questions = await buildDrillQuestions(profile.id, config);
    timeLimitSeconds = config.timeLimitSeconds;
  }

  if (questions.length === 0) {
    return (
      <div className="p-10 max-w-2xl">
        <div className="bg-cream-50 border border-coffee-700/10 rounded-2xl p-10 text-center">
          <div className="text-5xl mb-4">📭</div>
          <h1 className="font-display text-2xl font-semibold text-coffee-900 mb-2">
            No questions available
          </h1>
          <p className="text-coffee-600 mb-6">
            {isModule
              ? "This test has no questions yet. The site owner needs to add them in the admin panel."
              : "There are no published questions for this skill and difficulty yet."}
          </p>
          <a
            href={
              isModule
                ? session.section === "math"
                  ? "/app/math/modules"
                  : "/app/rw/modules"
                : session.section === "math"
                ? "/app/math/drills"
                : "/app/rw/drills"
            }
            className="inline-block bg-coffee-800 hover:bg-coffee-900 text-cream-50 px-6 py-2.5 rounded-full text-sm font-medium"
          >
            ← Back
          </a>
        </div>
      </div>
    );
  }

  // Load passages
  const passageIds = Array.from(
    new Set(questions.map((q) => q.passage_id).filter((id): id is number => id !== null))
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

  const practiceMode = isModule ? "test" : (session.practice_mode ?? "practice");

  return (
    <PracticeRunner
      sessionId={sessionId}
      section={session.section}
      skill={isModule ? `${session.section === "math" ? "Math" : "R&W"} module` : session.skill}
      practiceMode={practiceMode}
      questions={questions}
      passages={passages}
      timeLimitSeconds={timeLimitSeconds}
      mode={isModule ? "module" : "drill"}
    />
  );
}
