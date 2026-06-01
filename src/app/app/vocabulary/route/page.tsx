import Link from "next/link";
import { requireStudent } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase-server";
import WordRouteRunner from "@/components/WordRouteRunner";

export default async function WordRoutePage() {
  const { profile } = await requireStudent();
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: route } = await supabase
    .from("daily_routes")
    .select("*")
    .eq("user_id", profile.id)
    .eq("route_date", today)
    .maybeSingle();

  const routeIds: number[] = route?.word_ids ?? [];

  let words: any[] = [];
  if (routeIds.length > 0) {
    const { data: rw } = await supabase
      .from("user_vocab")
      .select("*")
      .in("id", routeIds);
    const byId: Record<number, any> = {};
    (rw ?? []).forEach((w) => { byId[w.id] = w; });
    words = routeIds.map((id) => byId[id]).filter(Boolean);
  }

  if (!route || words.length === 0) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-cream-50 border border-coffee-700/10 rounded-3xl p-10 text-center">
          <div className="text-4xl mb-3">🪐</div>
          <h1 className="font-display text-2xl font-semibold text-coffee-900 mb-2">
            No route for today
          </h1>
          <p className="text-coffee-600 mb-5">
            Save some words from passages or pick a list — they'll be assigned to tomorrow's route.
          </p>
          <Link
            href="/app/vocabulary"
            className="inline-block bg-coffee-800 text-cream-50 px-5 py-2.5 rounded-full text-sm font-medium hover:scale-[1.02] transition"
          >
            ← Back to vocabulary
          </Link>
        </div>
      </div>
    );
  }

  return (
    <WordRouteRunner
      userId={profile.id}
      routeId={route.id}
      words={words}
      clearedIds={route.cleared_word_ids ?? []}
    />
  );
}
