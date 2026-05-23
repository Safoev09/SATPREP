import { redirect } from "next/navigation";
import { requireLoggedInStudent } from "@/lib/auth-helpers";
import OnboardingFlow from "@/components/OnboardingFlow";

export default async function OnboardingPage() {
  const data = await requireLoggedInStudent();

  // If already completed, send to dashboard
  if (data.profile.target_score && data.profile.region && data.profile.target_exam_date) {
    redirect("/app");
  }

  return <OnboardingFlow userName={data.profile.full_name ?? ""} />;
}
