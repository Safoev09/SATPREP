import Link from "next/link";
import { requireStudent } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase-server";
import VocabularyView from "@/components/VocabularyView";

export default async function VocabularyPage() {
  const { profile } = await requireStudent();
  const supabase = createClient();

  // Personal saved words
  const { data: myWords } = await supabase
    .from("user_vocab")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  // Pre-made lists
  const { data: lists } = await supabase
    .from("vocab_lists")
    .select("id, title, description")
    .eq("is_published", true)
    .order("position", { ascending: true });

  // Count words in each list
  const listWordCounts: Record<number, number> = {};
  if (lists) {
    for (const l of lists) {
      const { count } = await supabase
        .from("vocab_words")
        .select("*", { count: "exact", head: true })
        .eq("list_id", l.id);
      listWordCounts[l.id] = count ?? 0;
    }
  }

  // Count due for review
  const nowIso = new Date().toISOString();
  const { count: dueCount } = await supabase
    .from("user_vocab")
    .select("*", { count: "exact", head: true })
    .eq("user_id", profile.id)
    .lte("next_review_at", nowIso);

  return (
    <VocabularyView
      userId={profile.id}
      myWords={myWords ?? []}
      lists={lists ?? []}
      listWordCounts={listWordCounts}
      dueCount={dueCount ?? 0}
    />
  );
}
