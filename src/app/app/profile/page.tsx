import { requireStudent } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase-server";
import ProfileEditor from "@/components/ProfileEditor";

export default async function ProfilePage() {
  const { profile, email } = await requireStudent();
  const supabase = createClient();

  // Fetch username + friend_id separately since they may not be in the base profile query
  const { data: fullProfile } = await supabase
    .from("profiles")
    .select("username, friend_id")
    .eq("id", profile.id)
    .single();

  return (
    <ProfileEditor
      email={email}
      fullName={profile.full_name ?? ""}
      previousScore={profile.previous_score}
      targetScore={profile.target_score}
      region={profile.region}
      targetExamDate={profile.target_exam_date}
      hasLifetimeAccess={profile.has_lifetime_access}
      username={fullProfile?.username ?? null}
      friendId={fullProfile?.friend_id ?? null}
    />
  );
}
