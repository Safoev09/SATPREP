import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import TestBuilder from "@/components/TestBuilder";

export default async function EditTestPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const id = parseInt(params.id);
  if (isNaN(id)) notFound();

  const { data: test } = await supabase
    .from("tests")
    .select("*")
    .eq("id", id)
    .single();

  if (!test) notFound();

  const { data: picks } = await supabase
    .from("test_questions")
    .select("question_id, slot, position")
    .eq("test_id", id)
    .order("position", { ascending: true });

  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("is_published", true)
    .order("id", { ascending: true });

  return (
    <TestBuilder
      existing={test}
      existingPicks={(picks ?? []).map((p) => ({
        question_id: p.question_id,
        slot: p.slot,
        position: p.position,
      }))}
      allQuestions={questions ?? []}
    />
  );
}
