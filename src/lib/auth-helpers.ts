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
  weekly_xp: number;
  tests_completed: number;
  rival_disabled: boolean;
};

export async function getUserAndProfile(): Promise<{
  email: string;
  profile: UserProfile;
} | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, is_admin, has_lifetime_access, diagnostic_completed, previous_score, target_score, region, target_exam_date, xp, current_streak, longest_streak, last_activity_date, weekly_xp, tests_completed, rival_disabled")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    email: user.email ?? "",
    profile: {
      ...profile,
      weekly_xp: profile.weekly_xp ?? 0,
      tests_completed: profile.tests_completed ?? 0,
      rival_disabled: profile.rival_disabled ?? false,
    },
  };
}

export async function requireStudent() {
  const data = await getUserAndProfile();
  if (!data) redirect("/login");
  if (data.profile.is_admin) redirect("/admin");

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

export async function requireLoggedInStudent() {
  const data = await getUserAndProfile();
  if (!data) redirect("/login");
  if (data.profile.is_admin) redirect("/admin");
  return data;
}
