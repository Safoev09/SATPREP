import { requireAdmin } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase-server";
import VocabAdminView from "@/components/VocabAdminView";

export default async function AdminVocabPage() {
  await requireAdmin();
  const supabase = createClient();

  const { data: lists } = await supabase
    .from("vocab_lists")
    .select("id, title, description, is_published, position")
    .order("position", { ascending: true });

  // Count words in each list
  const counts: Record<number, number> = {};
  for (const l of lists ?? []) {
    const { count } = await supabase
      .from("vocab_words")
      .select("*", { count: "exact", head: true })
      .eq("list_id", l.id);
    counts[l.id] = count ?? 0;
  }

  return <VocabAdminView lists={lists ?? []} counts={counts} />;
}
