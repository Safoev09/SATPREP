"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/app", label: "Dashboard", icon: "🏠", exact: true },
  { href: "/app/drills", label: "Skill Drills", icon: "⚡" },
  { href: "/app/practice", label: "Practice", icon: "📝" },
  { href: "/app/vocabulary", label: "Vocabulary", icon: "📚" },
  { href: "/app/study-plan", label: "Study Plan", icon: "🗓️" },
  { href: "/app/ai-tutor", label: "AI Tutor", icon: "🤖", badge: "New" },
  { href: "/app/leaderboard", label: "Leaderboard", icon: "🏆", badge: "New" },
  { href: "/app/progress", label: "Progress", icon: "📈" },
  { href: "/app/messages", label: "Messages", icon: "💬" },
];

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
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-cream-100">
      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 w-60 bg-cream-50 border-r border-coffee-700/10 flex flex-col
          transform transition-transform duration-200
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          lg:relative lg:translate-x-0 lg:flex
        `}
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b border-coffee-700/10">
          <Link href="/app" className="block">
            <span className="font-display text-xl font-semibold text-coffee-900">
              SATPeaK
            </span>
          </Link>
        </div>

        {/* XP + streak */}
        <div className="px-4 py-3 border-b border-coffee-700/10 flex items-center gap-3">
          <div className="flex-1 bg-cream-100 rounded-xl px-3 py-2 text-center">
            <div className="text-[11px] text-coffee-500 mb-0.5">XP</div>
            <div className="font-display text-base font-semibold text-coffee-900">
              {xp.toLocaleString()}
            </div>
          </div>
          <div className="flex-1 bg-cream-100 rounded-xl px-3 py-2 text-center">
            <div className="text-[11px] text-coffee-500 mb-0.5">Streak</div>
            <div className="font-display text-base font-semibold text-coffee-900">
              🔥 {streak}
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {NAV.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition group
                  ${active
                    ? "bg-coffee-800 text-cream-50"
                    : "text-coffee-700 hover:bg-cream-100"
                  }
                `}
              >
                <span className="text-base leading-none">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.badge && !active && (
                  <span className="text-[9px] font-bold bg-accent text-cream-50 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: profile + upgrade */}
        <div className="p-3 border-t border-coffee-700/10 space-y-1">
          {!hasLifetimeAccess && (
            <Link
              href="/app/upgrade"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 transition border border-amber-200"
            >
              <span>✨</span>
              <span>Upgrade to Pro</span>
            </Link>
          )}
          <Link
            href="/app/profile"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-coffee-700 hover:bg-cream-100 transition"
          >
            <div className="w-6 h-6 rounded-full bg-coffee-700 grid place-items-center text-cream-50 text-xs font-semibold shrink-0">
              {(userName || userEmail).slice(0, 1).toUpperCase()}
            </div>
            <span className="truncate">{userName || userEmail}</span>
          </Link>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-cream-50 border-b border-coffee-700/10 shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg hover:bg-cream-100 text-coffee-700"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />
            </svg>
          </button>
          <span className="font-display font-semibold text-coffee-900">SATPeaK</span>
          <div className="text-sm font-medium text-coffee-700">🔥 {streak}</div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
