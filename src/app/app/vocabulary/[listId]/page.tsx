import { notFound } from "next/navigation";
import { requireStudent } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase-server";
import VocabFlashcards from "@/components/VocabFlashcards";

export default async function VocabListPage({
  params,
}: {
  params: { listId: string };
}) {
  const { profile } = await requireStudent();
  const supabase = createClient();

  const listId = parseInt(params.listId, 10);
  if (Number.isNaN(listId)) notFound();

  const { data: list } = await supabase
    .from("vocab_lists")
    .select("*")
    .eq("id", listId)
    .single();

  if (!list) notFound();

  const { data: words } = await supabase
    .from("vocab_words")
    .select("*")
    .eq("list_id", listId)
    .order("id", { ascending: true });

  if (!words || words.length === 0) {
    return (
      <div className="p-8 max-w-2xl">
        <h1 className="font-display text-2xl text-coffee-900 mb-2">
          {list.title}
        </h1>
        <p className="text-coffee-600">This list is empty.</p>
      </div>
    );
  }

  return (
    <VocabFlashcards
      userId={profile.id}
      listTitle={list.title}
      listDescription={list.description}
      listId={list.id}
      words={words}
    />
  );
}
