import { createClient } from "@/lib/supabase-server";
import StudentsAdminView from "@/components/StudentsAdminView";

export default async function AdminStudentsPage() {
  const supabase = createClient();

  // Load all profiles (admin can read all thanks to is_admin policy)
  const { data: students } = await supabase
    .from("profiles")
    .select("id, full_name, has_lifetime_access, is_admin, target_score, target_exam_date, diagnostic_completed, xp, current_streak")
    .eq("is_admin", false)
    .order("full_name", { ascending: true });

  // For each profile, also get the email from auth.users via a Supabase RPC-style join.
  // Since we can't directly query auth.users from RLS-restricted contexts, we'll
  // fetch via admin auth API if needed — for now, profiles is enough.
  // (You can search by name; email lookup we'll show as "—" if not joined.)

  const totalCount = students?.length ?? 0;
  const premiumCount = students?.filter((s) => s.has_lifetime_access).length ?? 0;

  return (
    <StudentsAdminView
      students={students ?? []}
      totalCount={totalCount}
      premiumCount={premiumCount}
    />
  );
}
