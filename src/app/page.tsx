import { redirect } from "next/navigation";
import { getUserAndProfile } from "@/lib/auth-helpers";
import LandingPage from "@/components/LandingPage";

export default async function Home() {
  const data = await getUserAndProfile();

  if (data) {
    if (data.profile.is_admin) redirect("/admin");
    if (!data.profile.target_score || !data.profile.region || !data.profile.target_exam_date) {
      redirect("/onboarding");
    }
    redirect("/app");
  }

  return <LandingPage />;
}
