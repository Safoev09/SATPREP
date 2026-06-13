import { requireStudent } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase-server";
import ProfileEditor from "@/components/ProfileEditor";

export default async function ProfilePage() {
  const { profile, email } = await requireStudent();
  const supabase = createClient();

  const { data: extra } = await supabase
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
      username={extra?.username ?? null}
      friendId={extra?.friend_id ?? null}
    />
  );
}
