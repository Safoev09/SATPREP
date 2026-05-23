import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import QuestionForm from "@/components/QuestionForm";

export default async function EditQuestionPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const id = parseInt(params.id);
  if (isNaN(id)) notFound();

  const { data: question } = await supabase
    .from("questions")
    .select("*")
    .eq("id", id)
    .single();

  if (!question) notFound();

  // Load passage if any
  let passageText: string | null = null;
  if (question.passage_id) {
    const { data: passage } = await supabase
      .from("passages")
      .select("content")
      .eq("id", question.passage_id)
      .single();
    passageText = passage?.content ?? null;
  }

  return <QuestionForm existing={question} existingPassage={passageText} />;
}
