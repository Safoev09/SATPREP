"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { SAT_EXAM_DATES, getUpcomingExamDates } from "@/lib/exam-dates";

type Step = 1 | 2 | 3 | 4 | 5;

export default function OnboardingFlow({ userName }: { userName: string }) {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>(1);
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [previousScore, setPreviousScore] = useState<string>("");
  const [targetScore, setTargetScore] = useState<number>(1400);
  const [region, setRegion] = useState<"us" | "international">("international");
  const [examDate, setExamDate] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableDates = getUpcomingExamDates(region);

  const next = () => {
    if (step < 5) setStep((step + 1) as Step);
  };
  const back = () => {
    if (step > 1) setStep((step - 1) as Step);
  };

  const validateUsername = async () => {
    const trimmed = username.trim();
    if (trimmed.length > 0 && trimmed.length < 3) {
      setUsernameError("Username must be at least 3 characters.");
      return false;
    }
    if (trimmed.length === 0) {
      // username is optional during onboarding — can skip
      return true;
    }

    setCheckingUsername(true);
    setUsernameError(null);

    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", trimmed)
      .maybeSingle();

    setCheckingUsername(false);

    if (data) {
      setUsernameError("That username is already taken. Try another.");
      return false;
    }
    return true;
  };

  const handleNextFromUsername = async () => {
    const valid = await validateUsername();
    if (valid) next();
  };

  const handleFinish = async () => {
    setSaving(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not logged in.");
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        username: username.trim() || null,
        previous_score: previousScore ? parseInt(previousScore) : null,
        target_score: targetScore,
        region,
        target_exam_date: examDate,
      })
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    router.push("/app");
    router.refresh();
  };

  const TOTAL_STEPS = 5;

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Progress bar */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              className={`h-1.5 rounded-full transition-all ${
                n <= step ? "bg-coffee-800 w-12" : "bg-coffee-700/15 w-8"
              }`}
            />
          ))}
        </div>

        <div className="bg-cream-50 border border-coffee-700/10 rounded-3xl p-10 shadow-sm">
          {/* Step 1: Welcome */}
          {step === 1 && (
            <div>
              <p className="text-coffee-600 text-sm mb-2">Step 1 of {TOTAL_STEPS}</p>
              <h2 className="font-display text-3xl font-semibold text-coffee-900 mb-3">
                Welcome{userName ? `, ${userName.split(" ")[0]}` : ""} 👋
              </h2>
              <p className="text-coffee-700 text-lg mb-2">
                Before we dive in, let's set up your prep plan.
              </p>
              <p className="text-coffee-600 mb-8">
                It takes about a minute. We'll ask about your username, goals, and start you on a quick diagnostic to see where you stand today.
              </p>
              <button
                onClick={next}
                className="bg-coffee-800 hover:bg-coffee-900 text-cream-50 px-7 py-3 rounded-full font-medium transition"
              >
                Let's go →
              </button>
            </div>
          )}

          {/* Step 2: Username */}
          {step === 2 && (
            <div>
              <p className="text-coffee-600 text-sm mb-2">Step 2 of {TOTAL_STEPS}</p>
              <h2 className="font-display text-3xl font-semibold text-coffee-900 mb-3">
                Pick your username 🏷️
              </h2>
              <p className="text-coffee-600 mb-7">
                Your username lets classmates find you in the community, add you as a friend, and invite you to study groups. You can always change it later in Settings.
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-coffee-800 mb-1.5">
                  Username <span className="text-coffee-400 font-normal">(optional — skip if you prefer)</span>
                </label>
                <div className="flex items-center">
                  <span className="bg-cream-200 border border-coffee-700/15 border-r-0 rounded-l-xl px-3 py-2.5 text-sm text-coffee-600 select-none">
                    @
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) =>
                      setUsername(
                        e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")
                      )
                    }
                    placeholder="yourname"
                    maxLength={20}
                    className="flex-1 border border-coffee-700/15 rounded-r-xl px-3 py-2.5 text-sm bg-cream-50 focus:outline-none focus:ring-2 focus:ring-coffee-500/20"
                    style={{ borderLeft: "none" }}
                  />
                </div>
                <p className="text-xs text-coffee-500 mt-1.5">
                  Letters, numbers, and underscores only · 3–20 characters
                </p>
                {usernameError && (
                  <p className="text-xs text-red-600 mt-1.5 font-medium">{usernameError}</p>
                )}
                {username.length >= 3 && !usernameError && (
                  <p className="text-xs text-green-700 mt-1.5 font-medium">
                    ✓ Looks good — we'll check availability when you continue
                  </p>
                )}
              </div>

              {/* Preview card */}
              {username.length >= 3 && (
                <div className="mb-6 bg-cream-100 border border-coffee-700/10 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-coffee-700 grid place-items-center text-cream-50 font-display font-semibold text-sm">
                    {username.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-coffee-900">
                      {userName || "You"}
                    </div>
                    <div className="text-xs text-coffee-500">@{username}</div>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <button
                  onClick={back}
                  className="text-coffee-700 hover:text-coffee-900 text-sm font-medium"
                >
                  ← Back
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={next}
                    className="text-coffee-600 hover:text-coffee-900 text-sm font-medium px-4 py-2 rounded-full border border-coffee-700/15 hover:bg-cream-100 transition"
                  >
                    Skip for now
                  </button>
                  <button
                    onClick={handleNextFromUsername}
                    disabled={checkingUsername}
                    className="bg-coffee-800 hover:bg-coffee-900 disabled:opacity-50 text-cream-50 px-7 py-3 rounded-full font-medium transition"
                  >
                    {checkingUsername ? "Checking…" : "Continue →"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Scores */}
          {step === 3 && (
            <div>
              <p className="text-coffee-600 text-sm mb-2">Step 3 of {TOTAL_STEPS}</p>
              <h2 className="font-display text-3xl font-semibold text-coffee-900 mb-3">
                What's your previous SAT score?
              </h2>
              <p className="text-coffee-600 mb-7">
                Optional — leave blank if you haven't taken the SAT before. This just helps us calibrate.
              </p>
              <div className="mb-6">
                <label>Previous score (400–1600)</label>
                <input
                  type="number"
                  min={400}
                  max={1600}
                  value={previousScore}
                  onChange={(e) => setPreviousScore(e.target.value)}
                  placeholder="e.g. 1180"
                />
              </div>
              <div className="mb-8">
                <label>Target score</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={400}
                    max={1600}
                    step={10}
                    value={targetScore}
                    onChange={(e) => setTargetScore(parseInt(e.target.value))}
                    style={{ width: "auto", flex: 1 }}
                    className="accent-coffee-700"
                  />
                  <div className="font-display text-3xl font-semibold text-coffee-800 w-24 text-right">
                    {targetScore}
                  </div>
                </div>
              </div>
              <div className="flex justify-between">
                <button
                  onClick={back}
                  className="text-coffee-700 hover:text-coffee-900 text-sm font-medium"
                >
                  ← Back
                </button>
                <button
                  onClick={next}
                  className="bg-coffee-800 hover:bg-coffee-900 text-cream-50 px-7 py-3 rounded-full font-medium"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Region */}
          {step === 4 && (
            <div>
              <p className="text-coffee-600 text-sm mb-2">Step 4 of {TOTAL_STEPS}</p>
              <h2 className="font-display text-3xl font-semibold text-coffee-900 mb-3">
                Where will you take the SAT?
              </h2>
              <p className="text-coffee-600 mb-7">
                This tells us which test dates to show you.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <button
                  type="button"
                  onClick={() => setRegion("international")}
                  className={`p-6 rounded-2xl border-2 transition text-left ${
                    region === "international"
                      ? "border-coffee-800 bg-cream-200"
                      : "border-coffee-700/10 bg-cream-100 hover:border-beige-400"
                  }`}
                >
                  <div className="text-3xl mb-2">🌍</div>
                  <div className="font-display font-semibold text-lg text-coffee-900">
                    International
                  </div>
                  <div className="text-sm text-coffee-600">Outside the United States</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRegion("us")}
                  className={`p-6 rounded-2xl border-2 transition text-left ${
                    region === "us"
                      ? "border-coffee-800 bg-cream-200"
                      : "border-coffee-700/10 bg-cream-100 hover:border-beige-400"
                  }`}
                >
                  <div className="text-3xl mb-2">🇺🇸</div>
                  <div className="font-display font-semibold text-lg text-coffee-900">
                    United States
                  </div>
                  <div className="text-sm text-coffee-600">Inside the U.S. or its territories</div>
                </button>
              </div>
              <div className="flex justify-between">
                <button
                  onClick={back}
                  className="text-coffee-700 hover:text-coffee-900 text-sm font-medium"
                >
                  ← Back
                </button>
                <button
                  onClick={next}
                  className="bg-coffee-800 hover:bg-coffee-900 text-cream-50 px-7 py-3 rounded-full font-medium"
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Exam date */}
          {step === 5 && (
            <div>
              <p className="text-coffee-600 text-sm mb-2">Step 5 of {TOTAL_STEPS}</p>
              <h2 className="font-display text-3xl font-semibold text-coffee-900 mb-3">
                When are you taking the SAT?
              </h2>
              <p className="text-coffee-600 mb-7">
                Pick the date you're aiming for. We'll show a countdown and tune your study plan around it.
              </p>
              <div className="mb-6 space-y-2">
                {availableDates.length === 0 ? (
                  <div className="text-coffee-600">
                    No upcoming exam dates are configured yet. Pick the closest one your test center supports.
                  </div>
                ) : (
                  availableDates.map((d) => (
                    <button
                      key={d.date}
                      type="button"
                      onClick={() => setExamDate(d.date)}
                      className={`w-full text-left px-5 py-3.5 rounded-xl border-2 transition flex justify-between items-center ${
                        examDate === d.date
                          ? "border-coffee-800 bg-cream-200"
                          : "border-coffee-700/10 bg-cream-100 hover:border-beige-400"
                      }`}
                    >
                      <span className="font-medium text-coffee-900">{d.display}</span>
                      <span className="text-sm text-coffee-600">
                        {Math.ceil(
                          (new Date(d.date).getTime() - new Date().getTime()) /
                            (1000 * 60 * 60 * 24)
                        )}{" "}
                        days away
                      </span>
                    </button>
                  ))
                )}
              </div>

              {error && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  {error}
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={back}
                  className="text-coffee-700 hover:text-coffee-900 text-sm font-medium"
                >
                  ← Back
                </button>
                <button
                  onClick={handleFinish}
                  disabled={!examDate || saving}
                  className="bg-coffee-800 hover:bg-coffee-900 disabled:opacity-50 text-cream-50 px-7 py-3 rounded-full font-medium"
                >
                  {saving ? "Saving…" : "Finish setup →"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
