"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase-client";

type Student = {
  id: string;
  full_name: string | null;
  has_lifetime_access: boolean;
  is_admin: boolean;
  target_score: number | null;
  target_exam_date: string | null;
  diagnostic_completed: boolean;
  xp: number;
  current_streak: number;
};

export default function StudentsAdminView({
  students: initial,
  totalCount,
  premiumCount: initialPremiumCount,
}: {
  students: Student[];
  totalCount: number;
  premiumCount: number;
}) {
  const supabase = createClient();
  const [students, setStudents] = useState<Student[]>(initial);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "free" | "premium">("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return students.filter((s) => {
      // Filter by premium status
      if (filter === "free" && s.has_lifetime_access) return false;
      if (filter === "premium" && !s.has_lifetime_access) return false;
      // Search by name
      if (search.trim()) {
        const q = search.toLowerCase();
        const name = (s.full_name ?? "").toLowerCase();
        if (!name.includes(q) && !s.id.includes(q)) return false;
      }
      return true;
    });
  }, [students, search, filter]);

  const premiumCount = students.filter((s) => s.has_lifetime_access).length;

  const togglePremium = async (id: string, current: boolean) => {
    setBusy(id);
    const { error } = await supabase
      .from("profiles")
      .update({ has_lifetime_access: !current })
      .eq("id", id);
    setBusy(null);
    if (error) {
      setToast("Error: " + error.message);
      setTimeout(() => setToast(null), 3000);
      return;
    }
    setStudents(
      students.map((s) =>
        s.id === id ? { ...s, has_lifetime_access: !current } : s
      )
    );
    setToast(
      !current
        ? "✓ Granted premium access"
        : "✓ Reverted to free"
    );
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div className="p-10 max-w-6xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-coffee-900">
          Students
        </h1>
        <p className="text-coffee-600 mt-1">
          Manage student accounts. Flip premium on or off manually.
        </p>
      </div>

      {/* Helper note */}
      <div className="bg-cream-100 border border-coffee-700/10 rounded-2xl p-5 mb-6">
        <div className="flex items-start gap-3">
          <div className="text-2xl shrink-0">💡</div>
          <div className="text-sm text-coffee-700 leading-relaxed">
            <div className="font-medium text-coffee-900 mb-1">
              Manual upgrade workflow
            </div>
            <p>
              When a student wants premium, talk to them off-platform (Telegram, email, in person — your choice).
              Once you've agreed terms and they've fulfilled their side, find them here and flip{" "}
              <span className="font-medium">Premium</span> ON.
              The change takes effect immediately on their account.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Total students" value={totalCount} />
        <StatCard label="Premium" value={premiumCount} accent />
        <StatCard label="Free" value={totalCount - premiumCount} />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <input
          type="text"
          placeholder="Search by name or ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px]"
        />
        <div className="flex bg-cream-100 rounded-full p-1">
          {(["all", "free", "premium"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-4 py-1.5 rounded-full font-medium capitalize transition ${
                filter === f
                  ? "bg-coffee-800 text-cream-50"
                  : "text-coffee-600 hover:text-coffee-900"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="bg-cream-50 border border-coffee-700/10 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-coffee-600">
            No students match your filter.
          </div>
        ) : (
          <div className="divide-y divide-coffee-700/10">
            {filtered.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-4 p-4 hover:bg-cream-100 transition"
              >
                <div className="w-10 h-10 rounded-full bg-coffee-700 text-cream-50 grid place-items-center font-display font-semibold text-sm shrink-0">
                  {(s.full_name?.[0] ?? "?").toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-coffee-900 truncate">
                    {s.full_name || <em className="text-coffee-500">No name</em>}
                  </div>
                  <div className="text-xs text-coffee-500 truncate font-mono">
                    {s.id.slice(0, 8)}…
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-4 text-xs text-coffee-600">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-coffee-500">Goal</div>
                    <div className="font-medium">{s.target_score ?? "—"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-coffee-500">XP</div>
                    <div className="font-medium">{s.xp}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-coffee-500">Streak</div>
                    <div className="font-medium">🔥 {s.current_streak}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-coffee-500">Diag</div>
                    <div className="font-medium">{s.diagnostic_completed ? "✓" : "—"}</div>
                  </div>
                </div>

                {/* Premium toggle */}
                <button
                  onClick={() => togglePremium(s.id, s.has_lifetime_access)}
                  disabled={busy === s.id}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all hover:scale-[1.03] disabled:opacity-50 ${
                    s.has_lifetime_access
                      ? "bg-accent text-cream-50"
                      : "bg-cream-200 text-coffee-700 hover:bg-cream-200/80"
                  }`}
                >
                  {busy === s.id
                    ? "…"
                    : s.has_lifetime_access
                    ? "✨ Premium"
                    : "Free"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-coffee-900 text-cream-50 px-5 py-3 rounded-2xl shadow-lg text-sm animate-[fadeup_0.3s_ease-out]">
          {toast}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-5 border ${
      accent
        ? "bg-gradient-to-br from-accent/15 to-cream-200 border-accent/30"
        : "bg-cream-50 border-coffee-700/10"
    }`}>
      <div className="text-xs text-coffee-500 uppercase tracking-wider mb-1">{label}</div>
      <div className="font-display text-3xl font-semibold text-coffee-900">{value}</div>
    </div>
  );
}
