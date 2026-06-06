"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-client";
import { getUpcomingExamDates } from "@/lib/exam-dates";

export default function ProfileEditor({
  email,
  fullName,
  previousScore,
  targetScore,
  region,
  targetExamDate,
  hasLifetimeAccess,
  username: initialUsername,
  friendId,
}: {
  email: string;
  fullName: string;
  previousScore: number | null;
  targetScore: number | null;
  region: "us" | "international" | null;
  targetExamDate: string | null;
  hasLifetimeAccess: boolean;
  username?: string | null;
  friendId?: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState(fullName);
  const [username, setUsername] = useState(initialUsername ?? "");
  const [prevScore, setPrevScore] = useState(previousScore?.toString() ?? "");
  const [target, setTarget] = useState(targetScore ?? 1400);
  const [reg, setReg] = useState<"us" | "international">(region ?? "international");
  const [examDate, setExamDate] = useState(targetExamDate ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableDates = getUpcomingExamDates(reg);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Not logged in.");
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: name,
        username: username.trim() || null,
        previous_score: prevScore ? parseInt(prevScore) : null,
        target_score: target,
        region: reg,
        target_exam_date: examDate || null,
      })
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setSaved(true);
    setSaving(false);
    router.refresh();
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-10 max-w-2xl">
      <h1 className="font-display text-3xl font-semibold text-coffee-900 mb-1">
        Profile
      </h1>
      <p className="text-coffee-600 mb-8">
        Update your details and study plan any time.
      </p>

      <div className="bg-cream-50 border border-coffee-700/10 rounded-2xl p-6 space-y-5">
        <div>
          <label>Email</label>
          <input type="text" value={email} disabled style={{ opacity: 0.6 }} />
          <p className="text-xs text-coffee-600 mt-1">
            Email can't be changed here. Contact support if you need to.
          </p>
        </div>

        <div>
          <label>Full name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
        </div>

        <div>
          <label>Username <span className="text-coffee-500 font-normal text-xs">(for finding friends in chat)</span></label>
          <div className="flex items-center mt-1">
            <span className="bg-cream-200 border border-coffee-700/15 border-r-0 rounded-l-xl px-3 py-2 text-sm text-coffee-600 select-none">@</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              placeholder="yourname"
              maxLength={20}
              className="flex-1 border border-coffee-700/15 rounded-r-xl px-3 py-2 text-sm"
              style={{ borderLeft: "none" }}
            />
          </div>
          <p className="text-xs text-coffee-500 mt-1">Letters, numbers, underscores only. 3–20 characters.</p>
          {friendId && (
            <p className="text-xs text-coffee-600 mt-1">
              Your friend ID: <span className="font-mono font-semibold text-coffee-800">#{friendId}</span> — share this so others can find you.
            </p>
          )}
        </div>

        <div>
          <label>Previous SAT score (optional)</label>
          <input
            type="number"
            min={400}
            max={1600}
            value={prevScore}
            onChange={(e) => setPrevScore(e.target.value)}
            placeholder="e.g. 1180"
          />
        </div>

        <div>
          <label>Target score: <strong>{target}</strong></label>
          <input
            type="range"
            min={400}
            max={1600}
            step={10}
            value={target}
            onChange={(e) => setTarget(parseInt(e.target.value))}
            style={{ width: "100%" }}
            className="accent-coffee-700"
          />
        </div>

        <div>
          <label>Region</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setReg("international")}
              className={`p-3 rounded-xl border-2 transition text-sm font-medium ${
                reg === "international"
                  ? "border-coffee-800 bg-cream-200 text-coffee-900"
                  : "border-coffee-700/10 bg-cream-50 text-coffee-700 hover:border-beige-400"
              }`}
            >
              🌍 International
            </button>
            <button
              type="button"
              onClick={() => setReg("us")}
              className={`p-3 rounded-xl border-2 transition text-sm font-medium ${
                reg === "us"
                  ? "border-coffee-800 bg-cream-200 text-coffee-900"
                  : "border-coffee-700/10 bg-cream-50 text-coffee-700 hover:border-beige-400"
              }`}
            >
              🇺🇸 United States
            </button>
          </div>
        </div>

        <div>
          <label>Target exam date</label>
          <select value={examDate} onChange={(e) => setExamDate(e.target.value)}>
            <option value="">— Select a date —</option>
            {availableDates.map((d) => (
              <option key={d.date} value={d.date}>
                {d.display}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Plan</label>
          <div className="text-sm text-coffee-800">
            {hasLifetimeAccess ? (
              <span className="text-green-700 font-medium">✨ Lifetime access — all features unlocked</span>
            ) : (
              <span>
                Free preview ·{" "}
                <Link href="/app/upgrade" className="text-coffee-800 underline">
                  Upgrade for lifetime access
                </Link>
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={save}
            disabled={saving}
            className="bg-coffee-800 hover:bg-coffee-900 disabled:opacity-50 text-cream-50 px-6 py-2.5 rounded-full text-sm font-medium"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          {saved && (
            <span className="text-sm text-green-700 font-medium">✓ Saved</span>
          )}
        </div>
      </div>

      <div className="mt-8">
        <Link href="/app" className="text-coffee-700 hover:text-coffee-900 text-sm">
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}
