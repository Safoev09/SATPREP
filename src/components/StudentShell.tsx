"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";

export default function StudentShell({
  children,
  userEmail,
  userName,
  hasLifetimeAccess,
}: {
  children: React.ReactNode;
  userEmail: string;
  userName: string;
  hasLifetimeAccess: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const sections: {
    label: string;
    items: { href: string; label: string; icon: string; locked?: boolean; premium?: boolean }[];
  }[] = [
    {
      label: "",
      items: [{ href: "/app", label: "Dashboard", icon: "🏠" }],
    },
    {
      label: "Full SAT",
      items: [
        { href: "/app/full-test", label: "Full mock test", icon: "📝", premium: !hasLifetimeAccess },
      ],
    },
    {
      label: "Math",
      items: [
        { href: "/app/math/modules", label: "Math modules", icon: "🧮", premium: !hasLifetimeAccess },
        { href: "/app/math/drills", label: "Math drills", icon: "🎯" },
      ],
    },
    {
      label: "Reading & Writing",
      items: [
        { href: "/app/rw/modules", label: "R&W modules", icon: "📖", premium: !hasLifetimeAccess },
        { href: "/app/rw/drills", label: "R&W drills", icon: "🎯" },
      ],
    },
    {
      label: "Your data",
      items: [
        { href: "/app/review", label: "Review queue", icon: "🔖" },
        { href: "/app/progress", label: "Progress", icon: "📊" },
      ],
    },
    {
      label: "",
      items: [{ href: "/app/community", label: "Community chat", icon: "💬" }],
    },
  ];

  const initials = userName
    ? userName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : userEmail[0]?.toUpperCase() ?? "U";

  return (
    <div className="min-h-screen flex bg-cream-50">
      {/* Sidebar */}
      <aside className="w-64 bg-cream-100 border-r border-coffee-700/10 flex flex-col">
        <div className="p-5 border-b border-coffee-700/10">
          <Link href="/app" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-coffee-800 text-cream-50 grid place-items-center font-display italic font-bold">
              S
            </div>
            <span className="font-display font-semibold text-lg text-coffee-800">
              SATPrep
            </span>
          </Link>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto">
          {sections.map((sec, i) => (
            <div key={i} className="mb-4">
              {sec.label && (
                <div className="text-xs text-coffee-600 uppercase tracking-wider px-3 mb-1.5 font-medium">
                  {sec.label}
                </div>
              )}
              <div className="space-y-0.5">
                {sec.items.map((item) => {
                  const active =
                    item.href === "/app"
                      ? pathname === "/app"
                      : pathname.startsWith(item.href);
                  return item.locked ? (
                    <div
                      key={item.href}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-coffee-600/60 cursor-not-allowed"
                      title="Coming soon"
                    >
                      <span>{item.icon}</span>
                      <span className="flex-1">{item.label}</span>
                      <span className="text-xs">🔒</span>
                    </div>
                  ) : (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                        active
                          ? "bg-coffee-800 text-cream-50 font-medium"
                          : "text-coffee-700 hover:bg-cream-200"
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span className="flex-1">{item.label}</span>
                      {item.premium && (
                        <span className="text-[10px] bg-accent text-coffee-900 px-1.5 py-0.5 rounded-full font-medium">
                          PRO
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {!hasLifetimeAccess && (
          <div className="p-3 border-t border-coffee-700/10">
            <Link
              href="/app/upgrade"
              className="block bg-coffee-800 hover:bg-coffee-900 text-cream-50 text-center text-sm font-medium py-2.5 rounded-lg transition"
            >
              ✨ Unlock everything
            </Link>
            <p className="text-xs text-coffee-600 mt-2 text-center">
              19,900 so'm · lifetime
            </p>
          </div>
        )}
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col">
        {/* Top bar with profile dropdown */}
        <header className="bg-cream-50 border-b border-coffee-700/10 px-8 py-4 flex justify-end items-center">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 hover:bg-cream-100 rounded-full pl-2 pr-3 py-1.5 transition"
            >
              <div className="w-8 h-8 rounded-full bg-coffee-700 text-cream-50 grid place-items-center font-display font-semibold text-sm">
                {initials}
              </div>
              <span className="text-sm text-coffee-800 font-medium hidden sm:block">
                {userName || "Account"}
              </span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-coffee-600">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-cream-50 border border-coffee-700/10 rounded-xl shadow-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-coffee-700/10">
                  <div className="text-sm font-medium text-coffee-800 truncate">
                    {userName || "Account"}
                  </div>
                  <div className="text-xs text-coffee-600 truncate">{userEmail}</div>
                </div>
                <Link
                  href="/app/profile"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 text-sm text-coffee-700 hover:bg-cream-100"
                >
                  👤 Profile
                </Link>
                <Link
                  href="/app/settings"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 text-sm text-coffee-700 hover:bg-cream-100"
                >
                  ⚙️ Settings
                </Link>
                <button
                  onClick={logout}
                  className="block w-full text-left px-4 py-2.5 text-sm text-red-700 hover:bg-cream-100 border-t border-coffee-700/10"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
