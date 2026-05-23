import { requireStudent } from "@/lib/auth-helpers";
import StudentShell from "@/components/StudentShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const data = await requireStudent();

  return (
    <StudentShell
      userEmail={data.email}
      userName={data.profile.full_name ?? ""}
      hasLifetimeAccess={data.profile.has_lifetime_access}
      xp={data.profile.xp ?? 0}
      streak={data.profile.current_streak ?? 0}
    >
      {children}
    </StudentShell>
  );
}
