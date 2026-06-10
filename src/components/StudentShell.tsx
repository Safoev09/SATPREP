"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Load unread DM + group message count
    const loadUnread = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: memberRows } = await supabase
        .from("conversation_members")
        .select("conversation_id, last_read_at")
        .eq("user_id", user.id);
      if (!memberRows || memberRows.length === 0) return;
      let count = 0;
      for (const row of memberRows) {
        const { data: msg } = await supabase
          .from("messages")
          .select("created_at")
          .eq("conversation_id", row.conversation_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (msg && new Date(msg.created_at) > new Date(row.last_read_at ?? 0)) count++;
      }
      setUnreadCount(count);
    };
    loadUnread();
  }, [pathname, supabase]);

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
      items: [
        { href: "/app", label: "Today", icon: "home" },
        { href: "/app/study-plan", label: "Study Plan", icon: "calendar" },
      ],
    },
    {
      label: "Practice",
      items: [
        { href: "/app/drills", label: "Drills", icon: "target" },
        { href: "/app/question-bank", label: "Question Bank", icon: "library" },
        { href: "/app/full-test", label: "Mock Exams", icon: "exam" },
      ],
    },
    {
      label: "Learn",
      items: [
        { href: "/app/vocabulary", label: "Vocabulary", icon: "book" },
        { href: "/app/diagnostic", label: "Diagnostic", icon: "clipboard" },
      ],
    },
    {
      label: "Progress",
      items: [
        { href: "/app/progress", label: "Score Map", icon: "chart" },
        { href: "/app/review", label: "Review Queue", icon: "bookmark" },
      ],
    },
    {
      label: "Community",
      items: [
        { href: "/app/messages", label: "Messages", icon: "chat", badge: unreadCount > 0 ? String(unreadCount) : undefined },
      ],
    },
  ];

  const initials = userName
    ? userName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : userEmail[0]?.toUpperCase() ?? "U";

  return (
    <div className="min-h-screen flex bg-cream-100 transition-colors duration-300">
      {/* ===== SIDEBAR ===== */}
      <aside data-shell="true" className="w-64 bg-cream-50 border-r border-coffee-700/10 flex flex-col fixed h-screen transition-colors duration-300">
        {/* Logo */}
        <div className="px-5 py-5">
          <Link href="/app" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-coffee-800 text-cream-50 grid place-items-center font-display italic font-bold text-lg">
              S
            </div>
            <div>
              <div className="font-display font-semibold text-coffee-900 leading-none">
                SATPeaK
              </div>
              <div className="text-[10px] text-coffee-500 uppercase tracking-wider mt-1">
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
                <div className="text-[11px] text-coffee-500 uppercase tracking-[0.12em] px-3 mb-2 font-semibold">
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
                          ? "bg-coffee-800 text-cream-50 font-medium shadow-sm"
                          : "text-coffee-700 hover:bg-cream-200"
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
          <div className="bg-gradient-to-br from-accent/15 to-cream-200 rounded-2xl p-4 border border-accent/20">
            <div className="flex items-center gap-2.5">
              <div className="text-2xl">🔥</div>
              <div>
                <div className="font-display font-semibold text-coffee-900 text-sm leading-tight">
                  {streak > 0 ? `${streak}-day streak` : "Start your streak"}
                </div>
                <div className="text-[11px] text-coffee-600">
                  {streak > 0 ? "Keep it alive today" : "Practise today to begin"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ===== MAIN COLUMN ===== */}
      <div className="flex flex-col min-h-screen ml-64 w-[calc(100vw-16rem)]">
        {/* Top bar */}
        <header data-shell="true" className="bg-cream-50/80 backdrop-blur border-b border-coffee-700/10 px-8 py-3 flex justify-between items-center sticky top-0 z-20 transition-colors duration-300">
          {/* XP + streak chips */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-cream-100 rounded-full px-3 py-1.5 border border-coffee-700/10">
              <span className="text-sm">💎</span>
              <span className="text-sm font-semibold text-coffee-800">{xp}</span>
              <span className="text-xs text-coffee-500">XP</span>
            </div>
            <div className="flex items-center gap-1.5 bg-cream-100 rounded-full px-3 py-1.5 border border-coffee-700/10">
              <span className="text-sm">🔥</span>
              <span className="text-sm font-semibold text-coffee-800">{streak}</span>
              <span className="text-xs text-coffee-500">streak</span>
            </div>
          </div>

          {/* Profile menu */}
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
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-coffee-500">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-60 glass rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-coffee-700/10">
                  <div className="text-sm font-medium text-coffee-800 truncate">
                    {userName || "Account"}
                  </div>
                  <div className="text-xs text-coffee-500 truncate">{userEmail}</div>
                </div>
                <Link href="/app/profile" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm text-coffee-700 hover:bg-cream-100/60 transition">
                  Profile
                </Link>
                <Link href="/app/settings" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm text-coffee-700 hover:bg-cream-100/60 transition">
                  Settings
                </Link>
                {!hasLifetimeAccess && (
                  <Link href="/app/upgrade" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm text-accent font-medium hover:bg-cream-100/60 transition">
                    ✨ Upgrade to premium
                  </Link>
                )}
                <button onClick={logout} className="block w-full text-left px-4 py-2.5 text-sm text-red-700 hover:bg-cream-100/60 border-t border-coffee-700/10 transition">
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
    case "calendar":
      return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></svg>;
    case "library":
      return <svg {...common}><path d="M4 4h4v16H4z" /><path d="M10 4h4v16h-4z" /><path d="M16 6l4 1-3 14-4-1z" /></svg>;
    default:
      return <svg {...common}><circle cx="12" cy="12" r="9" /></svg>;
  }
}


