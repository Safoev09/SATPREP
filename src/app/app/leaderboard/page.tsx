import { requireStudent } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase-server";
import LeaderboardView from "@/components/LeaderboardView";

export default async function LeaderboardPage() {
  const { profile } = await requireStudent();
  const supabase = createClient();

  // Top 50 by XP
  const { data: topUsers } = await supabase
    .from("profiles")
    .select("id, full_name, username, xp, current_streak, longest_streak")
    .order("xp", { ascending: false })
    .limit(50);

  // Find current user's rank
  const { count: myRank } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gt("xp", profile.xp ?? 0);

  return (
    <LeaderboardView
      topUsers={topUsers ?? []}
      currentUserId={profile.id}
      currentUserRank={(myRank ?? 0) + 1}
      currentUserXp={profile.xp ?? 0}
    />
  );
}
