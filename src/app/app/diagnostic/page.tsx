import Link from "next/link";
import { requireStudent } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase-server";
import DiagnosticRunner from "@/components/DiagnosticRunner";

export default async function DiagnosticPage() {
  const { profile } = await requireStudent();
  const supabase = createClient();

  // Load all diagnostic questions
  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("source_test", "Diagnostic")
    .eq("is_published", true)
    .order("source_question_number", { ascending: true });

  // Load passages referenced by diagnostic questions
  const passageIds = Array.from(
    new Set((questions ?? []).map((q) => q.passage_id).filter((id): id is number => id !== null))
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

  // No questions loaded — guide the admin to run the seed file
  if (!questions || questions.length === 0) {
    return (
      <div className="p-10 max-w-2xl">
        <div className="bg-cream-50 border border-coffee-700/10 rounded-2xl p-10 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h1 className="font-display text-2xl font-semibold text-coffee-900 mb-2">
            Diagnostic not set up yet
          </h1>
          <p className="text-coffee-600 mb-6">
            The diagnostic questions haven't been loaded into the database.
            The site owner needs to run the <code>diagnostic-questions.sql</code> file
            in Supabase first.
          </p>
          <Link
            href="/app"
            className="inline-block bg-coffee-800 hover:bg-coffee-900 text-cream-50 px-6 py-2.5 rounded-full text-sm font-medium"
          >
            ← Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <DiagnosticRunner
      questions={questions}
      passages={passages}
      alreadyCompleted={profile.diagnostic_completed}
    />
  );
}
