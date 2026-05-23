import { createClient } from "@/lib/supabase-client";

// Call this after a student completes any practice (drill, module, test, diagnostic).
// Awards XP and updates the day streak.
export async function awardProgress(opts: {
  userId: string;
  xpEarned: number;
}) {
  const supabase = createClient();

  // Read current gamification state
  const { data: profile } = await supabase
    .from("profiles")
    .select("xp, current_streak, longest_streak, last_activity_date")
    .eq("id", opts.userId)
    .single();

  if (!profile) return;

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  let newStreak = profile.current_streak ?? 0;
  const last = profile.last_activity_date;

  if (last === todayStr) {
    // Already practised today — streak unchanged
  } else if (last === yesterdayStr) {
    // Practised yesterday — streak continues
    newStreak += 1;
  } else {
    // Missed a day (or first ever) — streak resets to 1
    newStreak = 1;
  }

  const newLongest = Math.max(profile.longest_streak ?? 0, newStreak);
  const newXp = (profile.xp ?? 0) + opts.xpEarned;

  await supabase
    .from("profiles")
    .update({
      xp: newXp,
      current_streak: newStreak,
      longest_streak: newLongest,
      last_activity_date: todayStr,
    })
    .eq("id", opts.userId);
}

// XP awarded per correct answer, plus a completion bonus
export function calculateXp(correctCount: number, mode: string): number {
  const perCorrect = 10;
  const completionBonus =
    mode === "full_test" ? 200 : mode === "module" ? 80 : mode === "diagnostic" ? 100 : 30;
  return correctCount * perCorrect + completionBonus;
}
