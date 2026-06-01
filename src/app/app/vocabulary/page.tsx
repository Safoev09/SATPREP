import { requireStudent } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase-server";
import VocabularyDashboard from "@/components/VocabularyDashboard";

const TODAY_ROUTE_SIZE = 10;

export default async function VocabularyPage() {
  const { profile } = await requireStudent();
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  // 1) Load today's daily route (create one if it doesn't exist)
  let { data: route } = await supabase
    .from("daily_routes")
    .select("*")
    .eq("user_id", profile.id)
    .eq("route_date", today)
    .maybeSingle();

  if (!route) {
    // Auto-generate today's route from words the student hasn't mastered yet
    const { data: dueWords } = await supabase
      .from("user_vocab")
      .select("id, word, definition, example, box, mastery_state, source_list_id, source_type")
      .eq("user_id", profile.id)
      .neq("mastery_state", "mastered")
      .order("next_review_at", { ascending: true })
      .limit(TODAY_ROUTE_SIZE);

    // If the student has no personal saved words yet, seed from "SAT Power 400" list
    let routeWordIds: number[] = (dueWords ?? []).map((w) => w.id);
    let routeWords = dueWords ?? [];

    if (routeWordIds.length < TODAY_ROUTE_SIZE) {
      const needed = TODAY_ROUTE_SIZE - routeWordIds.length;
      const { data: power400 } = await supabase
        .from("vocab_lists")
        .select("id")
        .eq("title", "SAT Power 400")
        .maybeSingle();
      if (power400) {
        const { data: words } = await supabase
          .from("vocab_words")
          .select("*")
          .eq("list_id", power400.id)
          .limit(needed * 3); // pick more, then random
        if (words && words.length > 0) {
          // Pick a random subset
          const shuffled = [...words].sort(() => Math.random() - 0.5).slice(0, needed);
          // Save them as user_vocab in 'new' state
          for (const w of shuffled) {
            const { data: inserted } = await supabase
              .from("user_vocab")
              .insert({
                user_id: profile.id,
                word: w.word,
                definition: w.definition,
                example: w.example,
                source_type: "list",
                source_list_id: power400.id,
                mastery_state: "new",
              })
              .select()
              .maybeSingle();
            if (inserted) {
              routeWordIds.push(inserted.id);
              routeWords.push(inserted as any);
            }
          }
        }
      }
    }

    const { data: newRoute } = await supabase
      .from("daily_routes")
      .insert({
        user_id: profile.id,
        route_date: today,
        word_ids: routeWordIds,
        cleared_word_ids: [],
      })
      .select()
      .maybeSingle();
    route = newRoute;
  }

  // 2) Fetch the route's words (full data)
  const routeIds: number[] = route?.word_ids ?? [];
  let routeWordList: any[] = [];
  if (routeIds.length > 0) {
    const { data: rw } = await supabase
      .from("user_vocab")
      .select("*")
      .in("id", routeIds);
    // Preserve order from route.word_ids
    const byId: Record<number, any> = {};
    (rw ?? []).forEach((w) => { byId[w.id] = w; });
    routeWordList = routeIds.map((id) => byId[id]).filter(Boolean);
  }

  // 3) Mastery counts
  const { data: allUserWords } = await supabase
    .from("user_vocab")
    .select("id, mastery_state")
    .eq("user_id", profile.id);

  const counts = {
    new: 0,
    learning: 0,
    due: 0,
    mastered: 0,
  };
  (allUserWords ?? []).forEach((w) => {
    const s = (w.mastery_state ?? "new") as keyof typeof counts;
    if (counts[s] !== undefined) counts[s]++;
  });
  const totalUserWords = (allUserWords?.length ?? 0);

  // 4) Open mistakes
  const { count: mistakesCount } = await supabase
    .from("vocab_mistakes")
    .select("*", { count: "exact", head: true })
    .eq("user_id", profile.id)
    .is("resolved_at", null);

  // 5) Pre-made lists for the Library tab
  const { data: lists } = await supabase
    .from("vocab_lists")
    .select("id, title, description")
    .eq("is_published", true)
    .order("position", { ascending: true });

  // 6) Pick a "focus word" — first non-mastered word in the route, or any due word
  const focusWord =
    routeWordList.find((w) => w.mastery_state !== "mastered") ?? routeWordList[0] ?? null;

  return (
    <VocabularyDashboard
      userId={profile.id}
      routeWords={routeWordList}
      clearedIds={route?.cleared_word_ids ?? []}
      counts={counts}
      totalWords={totalUserWords}
      mistakesCount={mistakesCount ?? 0}
      lists={lists ?? []}
      focusWord={focusWord}
    />
  );
}
