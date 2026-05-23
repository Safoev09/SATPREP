import { createClient } from "@/lib/supabase-server";
import TestBuilder from "@/components/TestBuilder";

export default async function NewTestPage() {
  const supabase = createClient();
  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("is_published", true)
    .order("id", { ascending: true });

  return <TestBuilder allQuestions={questions ?? []} />;
}
