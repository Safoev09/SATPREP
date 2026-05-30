"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";
import { useTheme } from "@/components/ThemeProvider";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  badge?: string;
};

export default function StudentShell({
  children,
  userEmail,
  userName,
  hasLifetimeAccess,
  xp,
  streak,
}: {
  children: React.ReactNode;
  userEmail: string;
  userName: string;
  hasLifetimeAccess: boolean;
  xp: number;
  streak: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { theme, toggleTheme } = useTheme();
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

  const sections: { label: string; items: NavItem[] }[] = [
    {
      label: "",
      items: [{ href: "/app", label: "Today", icon: "home" }],
    },
    {
      label: "Practice",
      items: [
        { href: "/app/rw/drills", label: "R&W drills", icon: "target" },
        { href: "/app/math/drills", label: "Math drills", icon: "target" },
        { href: "/app/rw/modules", label: "R&W modules", icon: "book" },
        { href: "/app/math/modules", label: "Math modules", icon: "calc" },
        { href: "/app/full-test", label: "Mock exams", icon: "exam" },
      ],
    },
    {
      label: "Progress",
      items: [
        { href: "/app/progress", label: "Score map", icon: "chart" },
        { href: "/app/review", label: "Review queue", icon: "bookmark" },
      ],
    },
    {
      label: "Community",
      items: [
        { href: "/app/community", label: "Community chat", icon: "chat" },
        { href: "/app/diagnostic", label: "Diagnostic", icon: "clipboard" },
      ],
    },
  ];

  const initials = userName
    ? userName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : userEmail[0]?.toUpperCase() ?? "U";

  return (
    <div className="min-h-screen flex bg-cream-100 dark:bg-midnight-200 transition-colors duration-300">
      {/* ===== SIDEBAR ===== */}
      <aside className="w-64 bg-cream-50 dark:bg-midnight-100 border-r border-coffee-700/10 dark:border-cream-200/8 flex flex-col fixed h-screen transition-colors duration-300">
        {/* Logo */}
        <div className="px-5 py-5">
          <Link href="/app" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-coffee-800 dark:bg-accent text-cream-50 grid place-items-center font-display italic font-bold text-lg">
              S
            </div>
            <div>
              <div className="font-display font-semibold text-coffee-900 dark:text-cream-50 leading-none">
                SATPrep
              </div>
              <div className="text-[10px] text-coffee-500 dark:text-cream-200/60 uppercase tracking-wider mt-1">
                Digital SAT
              </div>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 overflow-y-auto">
          {sections.map((sec, i) => (
            <div key={i} className="mb-5">
              {sec.label && (
                <div className="text-[11px] text-coffee-500 dark:text-cream-200/50 uppercase tracking-[0.12em] px-3 mb-2 font-semibold">
                  {sec.label}
                </div>
              )}
              <div className="space-y-0.5">
                {sec.items.map((item) => {
                  const active =
                    item.href === "/app"
                      ? pathname === "/app"
                      : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                        active
                          ? "bg-coffee-800 dark:bg-accent text-cream-50 font-medium shadow-sm"
                          : "text-coffee-700 dark:text-cream-200/80 hover:bg-cream-200 dark:hover:bg-cream-200/5"
                      }`}
                    >
                      <NavIcon name={item.icon} active={active} />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded-full font-semibold">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Streak banner */}
        <div className="p-3">
          <div className="bg-gradient-to-br from-accent/15 to-cream-200 dark:from-accent/20 dark:to-midnight-50 rounded-2xl p-4 border border-accent/20 dark:border-accent/30">
            <div className="flex items-center gap-2.5">
              <div className="text-2xl">🔥</div>
              <div>
                <div className="font-display font-semibold text-coffee-900 dark:text-cream-100 text-sm leading-tight">
                  {streak > 0 ? `${streak}-day streak` : "Start your streak"}
                </div>
                <div className="text-[11px] text-coffee-600 dark:text-cream-200/70">
                  {streak > 0 ? "Keep it alive today" : "Practise today to begin"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ===== MAIN COLUMN ===== */}
      <div className="flex-1 flex flex-col ml-64">
        {/* Top bar */}
        <header className="bg-cream-50/80 dark:bg-midnight-100/80 backdrop-blur border-b border-coffee-700/10 dark:border-cream-200/8 px-8 py-3 flex justify-between items-center sticky top-0 z-20 transition-colors duration-300">
          {/* XP + streak chips */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-cream-100 dark:bg-midnight-50 rounded-full px-3 py-1.5 border border-coffee-700/10 dark:border-cream-200/10">
              <span className="text-sm">💎</span>
              <span className="text-sm font-semibold text-coffee-800 dark:text-cream-100">{xp}</span>
              <span className="text-xs text-coffee-500 dark:text-cream-200/60">XP</span>
            </div>
            <div className="flex items-center gap-1.5 bg-cream-100 dark:bg-midnight-50 rounded-full px-3 py-1.5 border border-coffee-700/10 dark:border-cream-200/10">
              <span className="text-sm">🔥</span>
              <span className="text-sm font-semibold text-coffee-800 dark:text-cream-100">{streak}</span>
              <span className="text-xs text-coffee-500 dark:text-cream-200/60">streak</span>
            </div>
          </div>

          {/* Profile menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 hover:bg-cream-100 dark:hover:bg-midnight-50 rounded-full pl-2 pr-3 py-1.5 transition"
            >
              <div className="w-8 h-8 rounded-full bg-coffee-700 dark:bg-accent text-cream-50 grid place-items-center font-display font-semibold text-sm">
                {initials}
              </div>
              <span className="text-sm text-coffee-800 dark:text-cream-100 font-medium hidden sm:block">
                {userName || "Account"}
              </span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-coffee-500 dark:text-cream-200/60">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-60 glass rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-coffee-700/10 dark:border-cream-200/10">
                  <div className="text-sm font-medium text-coffee-800 dark:text-cream-100 truncate">
                    {userName || "Account"}
                  </div>
                  <div className="text-xs text-coffee-500 dark:text-cream-200/60 truncate">{userEmail}</div>
                </div>
                <Link href="/app/profile" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm text-coffee-700 dark:text-cream-200 hover:bg-cream-100/60 dark:hover:bg-cream-200/5 transition">
                  Profile
                </Link>
                <Link href="/app/settings" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm text-coffee-700 dark:text-cream-200 hover:bg-cream-100/60 dark:hover:bg-cream-200/5 transition">
                  Settings
                </Link>
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-coffee-700 dark:text-cream-200 hover:bg-cream-100/60 dark:hover:bg-cream-200/5 transition"
                >
                  <span>{theme === "dark" ? "☀️ Light mode" : "🌙 Zen dark mode"}</span>
                  <span className="text-[10px] uppercase tracking-wider text-coffee-500 dark:text-cream-200/50">
                    {theme === "dark" ? "On" : "Off"}
                  </span>
                </button>
                {!hasLifetimeAccess && (
                  <Link href="/app/upgrade" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm text-accent font-medium hover:bg-cream-100/60 dark:hover:bg-cream-200/5 transition">
                    ✨ Upgrade to premium
                  </Link>
                )}
                <button onClick={logout} className="block w-full text-left px-4 py-2.5 text-sm text-red-700 dark:text-red-400 hover:bg-cream-100/60 dark:hover:bg-cream-200/5 border-t border-coffee-700/10 dark:border-cream-200/10 transition">
                  Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

// Simple inline SVG icons — calm, consistent line style. Inherits parent text color.
function NavIcon({ name }: { name: string; active?: boolean }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "home":
      return <svg {...common}><path d="M3 10l9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 21V12h6v9" /></svg>;
    case "target":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></svg>;
    case "book":
      return <svg {...common}><path d="M4 4h13a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2z" /><path d="M4 4v14" /></svg>;
    case "calc":
      return <svg {...common}><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 7h6M9 11h0M13 11h0M9 15h0M13 15h0" /></svg>;
    case "exam":
      return <svg {...common}><path d="M5 3h14v18l-7-4-7 4z" /></svg>;
    case "chart":
      return <svg {...common}><path d="M4 19V5M4 19h16M8 16v-5M13 16V8M18 16v-9" /></svg>;
    case "bookmark":
      return <svg {...common}><path d="M6 3h12v18l-6-4-6 4z" /></svg>;
    case "chat":
      return <svg {...common}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
    case "clipboard":
      return <svg {...common}><rect x="6" y="4" width="12" height="17" rx="2" /><path d="M9 4V2h6v2" /><path d="M9 11h6M9 15h4" /></svg>;
    default:
      return <svg {...common}><circle cx="12" cy="12" r="9" /></svg>;
  }
}
