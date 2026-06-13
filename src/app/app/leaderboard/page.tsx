import { requireStudent } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase-server";
import LeaderboardView from "@/components/LeaderboardView";

export default async function LeaderboardPage() {
  const { profile } = await requireStudent();
  const supabase = createClient();

  // Global leaderboard (top 50)
  const { data: globalRaw } = await supabase
    .from("leaderboard_global")
    .select("*")
    .order("global_rank", { ascending: true })
    .limit(50);

  // Weekly leaderboard (top 50 by weekly_xp)
  const { data: weeklyRaw } = await supabase
    .from("leaderboard_global")
    .select("*")
    .order("weekly_rank", { ascending: true })
    .limit(50);

  // Regional leaderboard
  const { data: regionalRaw } = profile.region
    ? await supabase
        .from("leaderboard_global")
        .select("*")
        .eq("region", profile.region)
        .order("xp", { ascending: false })
        .limit(50)
    : { data: [] };

  // Friends leaderboard — get friends first
  const { data: friendships } = await supabase
    .from("friendships")
    .select("requester, recipient")
    .or(`requester.eq.${profile.id},recipient.eq.${profile.id}`)
    .eq("status", "accepted");

  const friendIds = (friendships ?? []).map(f =>
    f.requester === profile.id ? f.recipient : f.requester
  );

  const { data: friendsRaw } = friendIds.length > 0
    ? await supabase
        .from("leaderboard_global")
        .select("*")
        .in("id", [...friendIds, profile.id])
        .order("xp", { ascending: false })
        .limit(50)
    : { data: [] };

  // Current user's rivals
  const { data: rivalsRaw } = await supabase
    .from("rivals")
    .select("rival_id")
    .eq("user_id", profile.id)
    .eq("is_active", true);

  const rivalIds = (rivalsRaw ?? []).map(r => r.rival_id);

  const { data: rivalProfiles } = rivalIds.length > 0
    ? await supabase
        .from("leaderboard_global")
        .select("*")
        .in("id", rivalIds)
    : { data: [] };

  // Find suggested rivals
  const { data: suggestedRivals } = await supabase.rpc("find_rivals", {
    p_user_id: profile.id,
    p_score: profile.previous_score ?? 800,
    p_target: profile.target_score ?? 1400,
    p_xp: profile.xp ?? 0,
    p_limit: 3,
  });

  // User's own rank
  const myGlobalEntry = (globalRaw ?? []).find(r => r.id === profile.id);
  const myWeeklyEntry = (weeklyRaw ?? []).find(r => r.id === profile.id);

  // Achievements
  const { data: achievements } = await supabase
    .from("achievements")
    .select("*")
    .eq("user_id", profile.id)
    .order("earned_at", { ascending: false })
    .limit(20);

  return (
    <LeaderboardView
      userId={profile.id}
      userName={profile.full_name?.split(" ")[0] ?? "You"}
      userXp={profile.xp ?? 0}
      userWeeklyXp={profile.weekly_xp ?? 0}
      userStreak={profile.current_streak ?? 0}
      userScore={profile.previous_score ?? 0}
      userTarget={profile.target_score ?? 1400}
      userRegion={profile.region ?? "international"}
      rivalDisabled={profile.rival_disabled ?? false}
      globalLeaderboard={globalRaw ?? []}
      weeklyLeaderboard={weeklyRaw ?? []}
      regionalLeaderboard={regionalRaw ?? []}
      friendsLeaderboard={friendsRaw ?? []}
      rivals={rivalProfiles ?? []}
      suggestedRivals={suggestedRivals ?? []}
      achievements={achievements ?? []}
      myGlobalRank={myGlobalEntry?.global_rank ?? null}
      myWeeklyRank={myWeeklyEntry?.weekly_rank ?? null}
    />
  );
}
