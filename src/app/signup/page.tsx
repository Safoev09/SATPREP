"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-client";

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Argentina","Armenia","Australia",
  "Austria","Azerbaijan","Bahrain","Bangladesh","Belarus","Belgium","Bolivia","Bosnia and Herzegovina",
  "Brazil","Bulgaria","Cambodia","Cameroon","Canada","Chile","China","Colombia","Croatia",
  "Cuba","Cyprus","Czech Republic","Denmark","Ecuador","Egypt","Estonia","Ethiopia",
  "Finland","France","Georgia","Germany","Ghana","Greece","Guatemala","Hungary",
  "India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Japan","Jordan",
  "Kazakhstan","Kenya","Kosovo","Kuwait","Kyrgyzstan","Latvia","Lebanon","Libya",
  "Lithuania","Luxembourg","Malaysia","Mexico","Moldova","Mongolia","Montenegro","Morocco",
  "Nepal","Netherlands","New Zealand","Nigeria","North Macedonia","Norway","Oman",
  "Pakistan","Palestine","Panama","Paraguay","Peru","Philippines","Poland","Portugal",
  "Qatar","Romania","Russia","Saudi Arabia","Senegal","Serbia","Singapore","Slovakia",
  "Slovenia","South Africa","South Korea","Spain","Sri Lanka","Sudan","Sweden",
  "Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Tunisia","Turkey",
  "Turkmenistan","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States",
  "Uruguay","Uzbekistan","Venezuela","Vietnam","Yemen","Zimbabwe",
].sort();

const SAT_SCORES = [
  "","400","450","500","550","600","650","700","750","800","850","900","950",
  "1000","1050","1100","1150","1200","1250","1300","1350","1400","1450","1500","1550","1600"
];

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 — account
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  // Step 2 — background
  const [country, setCountry] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [showCountryDrop, setShowCountryDrop] = useState(false);
  const [currentScore, setCurrentScore] = useState("");
  const [targetScore, setTargetScore] = useState("");
  const [examDate, setExamDate] = useState("");

  const filteredCountries = COUNTRIES.filter(c =>
    c.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const canGoStep2 = fullName.trim().length >= 2 && email.includes("@") && password.length >= 6;
  const canSubmit = country && targetScore;

  const handleCreate = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName.trim() } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user && !data.session) {
      setError("Check your email to confirm your account, then log in.");
      setLoading(false);
      return;
    }

    // Save extra profile data
    if (data.user) {
      await supabase.from("profiles").update({
        full_name: fullName.trim(),
        previous_score: currentScore ? parseInt(currentScore) : null,
        target_score: parseInt(targetScore),
        region: country === "United States" ? "us" : "international",
        target_exam_date: examDate || null,
      }).eq("id", data.user.id);
    }

    router.push("/onboarding");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="absolute top-[-20%] right-[-10%] w-[32rem] h-[32rem] rounded-full bg-accent/10 blur-3xl animate-drift1 pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-5%] w-[28rem] h-[28rem] rounded-full bg-beige-300/20 blur-3xl animate-drift2 pointer-events-none" />

      <div className="w-full max-w-md relative">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-2xl bg-coffee-800 text-cream-50 grid place-items-center font-display italic font-bold text-xl">S</div>
            <span className="font-display font-semibold text-2xl text-coffee-900">SATPeaK</span>
          </Link>
          <div className="mt-3 inline-flex items-center gap-1.5 bg-green-100 border border-green-300/60 text-green-800 text-xs font-semibold px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" />
            Free during beta — no payment needed
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                s < step ? "bg-green-600 text-white" : s === step ? "bg-coffee-800 text-cream-50" : "bg-cream-300 text-coffee-500"
              }`}>
                {s < step ? "✓" : s}
              </div>
              <div className={`text-xs font-medium ${s === step ? "text-coffee-900" : "text-coffee-400"}`}>
                {s === 1 ? "Account" : "Your Goals"}
              </div>
              {s < 2 && <div className={`flex-1 h-0.5 rounded ${step > s ? "bg-green-400" : "bg-cream-300"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-cream-50 border border-coffee-700/10 rounded-3xl p-7 shadow-sm">

          {/* ---- STEP 1: Account ---- */}
          {step === 1 && (
            <div>
              <h1 className="font-display text-2xl font-semibold text-coffee-900 mb-1">
                Create your account
              </h1>
              <p className="text-coffee-600 text-sm mb-6">
                Takes 2 minutes. Your prep starts right after.
              </p>

              <div className="space-y-4">
                <div>
                  <label>Full name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Akbar Safoev"
                    autoComplete="name"
                  />
                </div>

                <div>
                  <label>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label>Password</label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      autoComplete="new-password"
                      style={{ paddingRight: "3rem" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-coffee-400 hover:text-coffee-700 text-xs"
                    >
                      {showPass ? "Hide" : "Show"}
                    </button>
                  </div>
                  {password.length > 0 && password.length < 6 && (
                    <p className="text-xs text-red-600 mt-1">Must be at least 6 characters</p>
                  )}
                </div>
              </div>

              {error && (
                <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">{error}</div>
              )}

              <button
                onClick={() => canGoStep2 && setStep(2)}
                disabled={!canGoStep2}
                className="mt-6 w-full bg-coffee-800 hover:bg-coffee-900 disabled:opacity-40 text-cream-50 font-medium py-3 rounded-full transition"
              >
                Continue →
              </button>

              <p className="text-center text-sm text-coffee-600 mt-5">
                Already have an account?{" "}
                <Link href="/login" className="text-coffee-800 font-medium hover:underline">Log in</Link>
              </p>
            </div>
          )}

          {/* ---- STEP 2: Goals ---- */}
          {step === 2 && (
            <div>
              <h1 className="font-display text-2xl font-semibold text-coffee-900 mb-1">
                Tell us about your prep
              </h1>
              <p className="text-coffee-600 text-sm mb-6">
                This builds your personalized study plan from day one.
              </p>

              <div className="space-y-4">
                {/* Country picker */}
                <div className="relative">
                  <label>Country <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={country || countrySearch}
                    onChange={e => {
                      setCountrySearch(e.target.value);
                      setCountry("");
                      setShowCountryDrop(true);
                    }}
                    onFocus={() => setShowCountryDrop(true)}
                    placeholder="Search your country…"
                  />
                  {showCountryDrop && filteredCountries.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-cream-50 border border-coffee-700/15 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {filteredCountries.slice(0, 20).map(c => (
                        <button
                          key={c}
                          type="button"
                          onMouseDown={() => {
                            setCountry(c);
                            setCountrySearch(c);
                            setShowCountryDrop(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-cream-100 transition"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Current score */}
                <div>
                  <label>Current SAT score <span className="text-coffee-400 font-normal text-xs">(optional — leave blank if first attempt)</span></label>
                  <select value={currentScore} onChange={e => setCurrentScore(e.target.value)}>
                    <option value="">— I haven't taken it yet —</option>
                    {SAT_SCORES.filter(Boolean).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Target score */}
                <div>
                  <label>Target score <span className="text-red-500">*</span></label>
                  <select value={targetScore} onChange={e => setTargetScore(e.target.value)}>
                    <option value="">— Select your goal —</option>
                    {SAT_SCORES.filter(s => parseInt(s) >= 1000).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {targetScore && currentScore && parseInt(targetScore) <= parseInt(currentScore) && (
                    <p className="text-xs text-amber-600 mt-1">💡 Set a target higher than your current score!</p>
                  )}
                </div>

                {/* Exam date */}
                <div>
                  <label>Target exam date <span className="text-coffee-400 font-normal text-xs">(optional)</span></label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={e => setExamDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                  <p className="text-xs text-coffee-500 mt-1">Your study plan counts down to this date automatically.</p>
                </div>
              </div>

              {error && (
                <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">{error}</div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="px-5 py-3 text-sm text-coffee-700 hover:text-coffee-900 border border-coffee-700/15 rounded-full transition"
                >
                  ← Back
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!canSubmit || loading}
                  className="flex-1 bg-coffee-800 hover:bg-coffee-900 disabled:opacity-40 text-cream-50 font-medium py-3 rounded-full transition"
                >
                  {loading ? "Creating your account…" : "Start my prep →"}
                </button>
              </div>

              <p className="text-center text-xs text-coffee-400 mt-4">
                By creating an account you agree to our terms of service.
                Your data is never sold.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
