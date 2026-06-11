"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { getUpcomingExamDates } from "@/lib/exam-dates";

const STEPS = ["Welcome", "Identity", "Scores", "Exam"] as const;

export default function OnboardingFlow({ userName }: { userName: string }) {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(0);
  const [name, setName] = useState(userName);
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [prevScore, setPrevScore] = useState("");
  const [target, setTarget] = useState(1400);
  const [region, setRegion] = useState<"us" | "international">("international");
  const [examDate, setExamDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableDates = getUpcomingExamDates(region);

  const checkUsername = async (): Promise<boolean> => {
    const u = username.trim();
    if (u.length < 3) {
      setUsernameError("Username must be at least 3 characters.");
      return false;
    }
    setCheckingUsername(true);
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", u)
      .maybeSingle();
    setCheckingUsername(false);
    if (data) {
      setUsernameError("That username is taken — try another.");
      return false;
    }
    setUsernameError(null);
    return true;
  };

  const next = async () => {
    if (step === 1) {
      if (!name.trim()) { setError("Please enter your name."); return; }
      const ok = await checkUsername();
      if (!ok) return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const finish = async () => {
    if (!examDate) { setError("Pick your target exam date."); return; }
    setSaving(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Session expired — please log in again."); setSaving(false); return; }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: name.trim(),
        username: username.trim().toLowerCase(),
        previous_score: prevScore ? parseInt(prevScore) : null,
        target_score: target,
        region,
        target_exam_date: examDate,
      })
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message.includes("username") ? "Username just got taken — pick another." : updateError.message);
      setSaving(false);
      if (updateError.message.includes("username")) setStep(1);
      return;
    }

    router.push("/app");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient drifting orbs */}
      <div className="absolute top-[-10%] left-[5%] w-96 h-96 rounded-full bg-accent/10 blur-3xl animate-drift1 pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[0%] w-[28rem] h-[28rem] rounded-full bg-beige-300/20 blur-3xl animate-drift2 pointer-events-none" />

      <div className="w-full max-w-lg relative">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1">
              <div className={`h-1.5 rounded-full transition-all duration-500 ${i <= step ? "bg-coffee-800" : "bg-cream-200"}`} />
              <div className={`text-[10px] mt-1.5 uppercase tracking-wider font-semibold transition ${i <= step ? "text-coffee-800" : "text-coffee-400"}`}>
                {label}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-cream-50/90 backdrop-blur rounded-3xl border border-coffee-700/10 shadow-xl p-8 animate-fadeup">
          {/* STEP 0 — Welcome */}
          {step === 0 && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-coffee-800 text-cream-50 grid place-items-center font-display italic font-bold text-3xl mx-auto mb-5">
                S
              </div>
              <h1 className="font-display text-3xl font-semibold text-coffee-900 mb-2">
                Welcome to SATPeaK
              </h1>
              <p className="text-coffee-600 leading-relaxed mb-8 max-w-sm mx-auto">
                Two minutes of setup and we'll build a study plan around your exact target, schedule, and weak spots.
              </p>
              <button
                onClick={next}
                className="bg-coffee-800 hover:bg-coffee-900 text-cream-50 px-8 py-3.5 rounded-full font-medium hover:scale-[1.02] transition shadow-lg shadow-coffee-800/20"
              >
                Let's begin →
              </button>
            </div>
          )}

          {/* STEP 1 — Identity (name + username) */}
          {step === 1 && (
            <div>
              <h2 className="font-display text-2xl font-semibold text-coffee-900 mb-1">Who are you?</h2>
              <p className="text-coffee-600 text-sm mb-6">Your username lets friends find you in the community.</p>

              <label>Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Akbar Safoev"
                className="mb-4"
              />

              <label>Choose a username</label>
              <div className="flex items-center">
                <span className="bg-cream-200 border border-coffee-700/15 border-r-0 rounded-l-xl px-3 py-2.5 text-sm text-coffee-600 select-none">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""));
                    setUsernameError(null);
                  }}
                  placeholder="yourname"
                  maxLength={20}
                  style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeft: "none" }}
                />
              </div>
              <p className="text-xs text-coffee-500 mt-1.5">Letters, numbers, underscores. 3–20 characters. This is permanent-ish — choose well.</p>
              {usernameError && <p className="text-xs text-red-600 mt-1.5">{usernameError}</p>}
            </div>
          )}

          {/* STEP 2 — Scores */}
          {step === 2 && (
            <div>
              <h2 className="font-display text-2xl font-semibold text-coffee-900 mb-1">Your scores</h2>
              <p className="text-coffee-600 text-sm mb-6">This calibrates your starting point and goal.</p>

              <label>Previous SAT score (optional)</label>
              <input
                type="number"
                min={400}
                max={1600}
                value={prevScore}
                onChange={(e) => setPrevScore(e.target.value)}
                placeholder="e.g. 1180 — leave blank if first time"
                className="mb-5"
              />

              <label>
                Target score: <span className="font-display text-2xl text-coffee-900 ml-1">{target}</span>
              </label>
              <input
                type="range"
                min={400}
                max={1600}
                step={10}
                value={target}
                onChange={(e) => setTarget(parseInt(e.target.value))}
                className="w-full accent-coffee-700"
              />
              <div className="flex justify-between text-xs text-coffee-500 mt-1">
                <span>400</span><span>1000</span><span>1600</span>
              </div>
            </div>
          )}

          {/* STEP 3 — Region + exam date */}
          {step === 3 && (
            <div>
              <h2 className="font-display text-2xl font-semibold text-coffee-900 mb-1">Your exam</h2>
              <p className="text-coffee-600 text-sm mb-6">We'll count down and pace your plan to this date.</p>

              <label>Region</label>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <button
                  type="button"
                  onClick={() => setRegion("international")}
                  className={`p-3.5 rounded-xl border-2 transition text-sm font-medium ${
                    region === "international"
                      ? "border-coffee-800 bg-cream-200 text-coffee-900"
                      : "border-coffee-700/10 bg-cream-50 text-coffee-700 hover:border-beige-400"
                  }`}
                >
                  🌍 International
                </button>
                <button
                  type="button"
                  onClick={() => setRegion("us")}
                  className={`p-3.5 rounded-xl border-2 transition text-sm font-medium ${
                    region === "us"
                      ? "border-coffee-800 bg-cream-200 text-coffee-900"
                      : "border-coffee-700/10 bg-cream-50 text-coffee-700 hover:border-beige-400"
                  }`}
                >
                  🇺🇸 United States
                </button>
              </div>

              <label>Target exam date</label>
              <select value={examDate} onChange={(e) => setExamDate(e.target.value)}>
                <option value="">— Select a date —</option>
                {availableDates.map((d) => (
                  <option key={d.date} value={d.date}>{d.display}</option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3 mt-5">
              {error}
            </div>
          )}

          {/* Nav buttons */}
          {step > 0 && (
            <div className="flex items-center justify-between mt-8">
              <button
                onClick={() => setStep((s) => s - 1)}
                className="text-coffee-600 hover:text-coffee-900 text-sm px-2 py-2"
              >
                ← Back
              </button>
              {step < STEPS.length - 1 ? (
                <button
                  onClick={next}
                  disabled={checkingUsername}
                  className="bg-coffee-800 hover:bg-coffee-900 text-cream-50 px-7 py-3 rounded-full font-medium text-sm hover:scale-[1.02] transition disabled:opacity-50"
                >
                  {checkingUsername ? "Checking…" : "Continue →"}
                </button>
              ) : (
                <button
                  onClick={finish}
                  disabled={saving}
                  className="bg-coffee-800 hover:bg-coffee-900 text-cream-50 px-7 py-3 rounded-full font-medium text-sm hover:scale-[1.02] transition disabled:opacity-50"
                >
                  {saving ? "Building your plan…" : "Finish ✓"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
