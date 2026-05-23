import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export type UserProfile = {
  id: string;
  full_name: string | null;
  is_admin: boolean;
  has_lifetime_access: boolean;
  diagnostic_completed: boolean;
  previous_score: number | null;
  target_score: number | null;
  region: "us" | "international" | null;
  target_exam_date: string | null;
  xp: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
};

// Get the current user + their profile (server-side). Returns null if not logged in.
export async function getUserAndProfile(): Promise<{
  email: string;
  profile: UserProfile;
} | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, is_admin, has_lifetime_access, diagnostic_completed, previous_score, target_score, region, target_exam_date, xp, current_streak, longest_streak, last_activity_date")
    .eq("id", user.id)
    .single();

  if (!profile) return null;
  return { email: user.email ?? "", profile };
}

// Server-side guard: redirect to the right place based on user role and onboarding state.
// Call this from page components to enforce access.
export async function requireStudent() {
  const data = await getUserAndProfile();
  if (!data) redirect("/login");
  if (data.profile.is_admin) redirect("/admin");

  // Onboarding incomplete? Force them through it.
  if (!data.profile.target_score || !data.profile.region || !data.profile.target_exam_date) {
    redirect("/onboarding");
  }

  return data;
}

export async function requireAdmin() {
  const data = await getUserAndProfile();
  if (!data) redirect("/login");
  if (!data.profile.is_admin) redirect("/app");
  return data;
}

// For onboarding page itself — student must be logged in, but onboarding may be incomplete.
export async function requireLoggedInStudent() {
  const data = await getUserAndProfile();
  if (!data) redirect("/login");
  if (data.profile.is_admin) redirect("/admin");
  return data;
}
