import { requireStudent } from "@/lib/auth-helpers";
import ProfileEditor from "@/components/ProfileEditor";

export default async function ProfilePage() {
  const { profile, email } = await requireStudent();

  return (
    <ProfileEditor
      email={email}
      fullName={profile.full_name ?? ""}
      previousScore={profile.previous_score}
      targetScore={profile.target_score}
      region={profile.region}
      targetExamDate={profile.target_exam_date}
      hasLifetimeAccess={profile.has_lifetime_access}
    />
  );
}
