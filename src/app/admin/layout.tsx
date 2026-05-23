import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import AdminShell from "@/components/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, full_name")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    redirect("/login");
  }

  return (
    <AdminShell userEmail={user.email ?? ""} userName={profile.full_name ?? ""}>
      {children}
    </AdminShell>
  );
}
