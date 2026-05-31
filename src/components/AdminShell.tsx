"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";

export default function AdminShell({
  children,
  userEmail,
  userName,
}: {
  children: React.ReactNode;
  userEmail: string;
  userName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const nav = [
    { href: "/admin", label: "Dashboard", icon: "📊" },
    { href: "/admin/questions", label: "Question Bank", icon: "📚" },
    { href: "/admin/questions/new", label: "Add Question", icon: "➕" },
    { href: "/admin/tests", label: "Tests", icon: "📝" },
    { href: "/admin/students", label: "Students", icon: "👥" },
    { href: "/admin/upload", label: "Upload PDF", icon: "📄" },
  ];

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-coffee-900 text-cream-100 flex flex-col">
        <div className="p-6 border-b border-cream-100/10">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-cream-50 text-coffee-900 grid place-items-center font-display italic font-bold">
              S
            </div>
            <div>
              <div className="font-display font-semibold text-cream-50">SATPeaK</div>
              <div className="text-xs text-cream-200/60">Admin Panel</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {nav.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                  active
                    ? "bg-cream-50/10 text-cream-50 font-medium"
                    : "text-cream-200/70 hover:bg-cream-50/5 hover:text-cream-100"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-cream-100/10">
          <div className="text-xs text-cream-200/60 mb-1">Signed in as</div>
          <div className="text-sm text-cream-50 truncate" title={userEmail}>
            {userName || userEmail}
          </div>
          <button
            onClick={logout}
            className="mt-3 w-full text-left text-xs text-cream-200/70 hover:text-cream-50 transition"
          >
            Sign out →
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
