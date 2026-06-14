"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase-client";
import { getUpcomingExamDates } from "@/lib/exam-dates";

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Argentina","Armenia","Australia",
  "Austria","Azerbaijan","Bahrain","Bangladesh","Belarus","Belgium","Bolivia",
  "Bosnia and Herzegovina","Brazil","Bulgaria","Cambodia","Cameroon","Canada","Chile",
  "China","Colombia","Croatia","Cuba","Cyprus","Czech Republic","Denmark","Ecuador",
  "Egypt","Estonia","Ethiopia","Finland","France","Georgia","Germany","Ghana","Greece",
  "Guatemala","Hungary","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy",
  "Japan","Jordan","Kazakhstan","Kenya","Kuwait","Kyrgyzstan","Latvia","Lebanon",
  "Libya","Lithuania","Luxembourg","Malaysia","Mexico","Moldova","Mongolia","Montenegro",
  "Morocco","Nepal","Netherlands","New Zealand","Nigeria","North Macedonia","Norway",
  "Oman","Pakistan","Palestine","Panama","Paraguay","Peru","Philippines","Poland",
  "Portugal","Qatar","Romania","Russia","Saudi Arabia","Senegal","Serbia","Singapore",
  "Slovakia","Slovenia","South Africa","South Korea","Spain","Sri Lanka","Sudan",
  "Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Tunisia",
  "Turkey","Turkmenistan","Uganda","Ukraine","United Arab Emirates","United Kingdom",
  "United States","Uruguay","Uzbekistan","Venezuela","Vietnam","Yemen","Zimbabwe",
].sort();

const SAT_SCORES = Array.from({length: 25}, (_, i) => String(400 + i * 50));

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  // Step 1
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 2
  const [countrySearch, setCountrySearch] = useState("");
  const [country, setCountry] = useState("");
  const [showDrop, setShowDrop] = useState(false);
  const [currentScore, setCurrentScore] = useState("");
  const [targetScore, setTargetScore] = useState("");
  const [examDate, setExamDate] = useState("");

  const region: "us" | "international" = country === "United States" ? "us" : "international";
  const examDates = country ? getUpcomingExamDates(region) : [];
  const filtered = COUNTRIES.filter(c => c.toLowerCase().includes(countrySearch.toLowerCase())).slice(0, 15);

  const canStep2 = fullName.trim().length >= 2 && email.includes("@") && password.length >= 6;
  const canSubmit = !!country && !!targetScore;

  const handleCreate = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim() } },
    });

    if (err) { setError(err.message); setLoading(false); return; }

    if (data.user && !data.session) {
      setError("Check your email to confirm your account, then log in.");
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.from("profiles").update({
        full_name: fullName.trim(),
        previous_score: currentScore ? parseInt(currentScore) : null,
        target_score: parseInt(targetScore),
        region,
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

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-7">
          <Link href="/" className="inline-flex flex-col items-center gap-1">
            <div className="w-20 h-20 relative">
              <img
                src="/logo.png"
                alt="SATPeaK"
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback to text logo if image missing
                  (e.target as HTMLImageElement).style.display = "none";
                  const next = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                  if (next) next.style.display = "flex";
                }}
              />
              <div className="w-20 h-20 rounded-2xl bg-coffee-800 text-cream-50 items-center justify-center font-display italic font-bold text-3xl hidden">
                S
              </div>
            </div>
            <span className="font-display font-bold text-2xl text-coffee-900 tracking-tight">SATPeaK</span>
          </Link>
          <div className="mt-3 inline-flex items-center gap-1.5 bg-green-100 border border-green-300/60 text-green-800 text-xs font-semibold px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" />
            100% free · No credit card needed
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center mb-5 px-2">
          {[1, 2].map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                s < step ? "bg-green-600 text-white" : s === step ? "bg-coffee-800 text-cream-50 shadow-lg" : "bg-cream-200 text-coffee-500"
              }`}>
                {s < step ? "✓" : s}
              </div>
              <div className={`ml-2 text-xs font-medium ${s === step ? "text-coffee-900" : "text-coffee-400"}`}>
                {s === 1 ? "Account" : "Your Goals"}
              </div>
              {i < 1 && <div className={`flex-1 h-0.5 mx-3 rounded ${step > 1 ? "bg-green-400" : "bg-cream-200"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-cream-50 border border-coffee-700/10 rounded-3xl p-7 shadow-sm">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h1 className="font-display text-2xl font-semibold text-coffee-900">Create account</h1>
                <p className="text-coffee-500 text-sm mt-1">Your SAT prep starts right after.</p>
              </div>
              <div>
                <label>Full name</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Akbar Safoev" autoComplete="name" />
              </div>
              <div>
                <label>Email address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" autoComplete="email" />
              </div>
              <div>
                <label>Password</label>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 6 characters" autoComplete="new-password"
                    style={{ paddingRight: "3.5rem" }} />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-coffee-400 hover:text-coffee-700">
                    {showPass ? "Hide" : "Show"}
                  </button>
                </div>
                {password.length > 0 && password.length < 6 && (
                  <p className="text-xs text-red-600 mt-1">At least 6 characters</p>
                )}
              </div>
              {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">{error}</div>}
              <button onClick={() => canStep2 && setStep(2)} disabled={!canStep2}
                className="w-full bg-coffee-800 hover:bg-coffee-900 disabled:opacity-40 text-cream-50 font-medium py-3 rounded-full transition mt-2">
                Continue →
              </button>
              <p className="text-center text-sm text-coffee-500">
                Already have an account?{" "}
                <Link href="/login" className="text-coffee-800 font-medium hover:underline">Log in</Link>
              </p>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h1 className="font-display text-2xl font-semibold text-coffee-900">Your prep goals</h1>
                <p className="text-coffee-500 text-sm mt-1">Builds your personal study plan instantly.</p>
              </div>

              {/* Country */}
              <div className="relative">
                <label>Country <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={country || countrySearch}
                  onChange={e => { setCountrySearch(e.target.value); setCountry(""); setShowDrop(true); }}
                  onFocus={() => setShowDrop(true)}
                  onBlur={() => setTimeout(() => setShowDrop(false), 150)}
                  placeholder="Search country…"
                />
                {showDrop && filtered.length > 0 && !country && (
                  <div className="absolute z-30 w-full mt-1 bg-cream-50 border border-coffee-700/15 rounded-xl shadow-xl max-h-44 overflow-y-auto">
                    {filtered.map(c => (
                      <button key={c} type="button"
                        onMouseDown={() => { setCountry(c); setCountrySearch(c); setShowDrop(false); setExamDate(""); }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-cream-100 transition first:rounded-t-xl last:rounded-b-xl">
                        {c === "Uzbekistan" ? "🇺🇿 " : c === "United States" ? "🇺🇸 " : ""}{c}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Current score */}
              <div>
                <label>Current SAT score <span className="text-coffee-400 font-normal text-xs">(optional)</span></label>
                <select value={currentScore} onChange={e => setCurrentScore(e.target.value)}>
                  <option value="">— Haven't taken it yet —</option>
                  {SAT_SCORES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Target score */}
              <div>
                <label>Target score <span className="text-red-500">*</span></label>
                <select value={targetScore} onChange={e => setTargetScore(e.target.value)}>
                  <option value="">— Select your goal —</option>
                  {SAT_SCORES.filter(s => parseInt(s) >= 1000).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Exam date — filtered by country region */}
              <div>
                <label>
                  Target exam date{" "}
                  <span className="text-coffee-400 font-normal text-xs">
                    {country ? `(${region === "us" ? "US" : "International"} dates)` : "(select country first)"}
                  </span>
                </label>
                <select value={examDate} onChange={e => setExamDate(e.target.value)} disabled={!country}>
                  <option value="">— No date yet —</option>
                  {examDates.map(d => <option key={d.date} value={d.date}>{d.display}</option>)}
                </select>
                {country && examDates.length === 0 && (
                  <p className="text-xs text-coffee-400 mt-1">No upcoming dates available — you can set one in your profile later.</p>
                )}
              </div>

              {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">{error}</div>}

              <div className="flex gap-3 pt-1">
                <button onClick={() => setStep(1)}
                  className="px-5 py-3 text-sm text-coffee-700 border border-coffee-700/15 rounded-full hover:bg-cream-100 transition">
                  ← Back
                </button>
                <button onClick={handleCreate} disabled={!canSubmit || loading}
                  className="flex-1 bg-coffee-800 hover:bg-coffee-900 disabled:opacity-40 text-cream-50 font-medium py-3 rounded-full transition">
                  {loading ? "Creating account…" : "Start my prep →"}
                </button>
              </div>
              <p className="text-center text-xs text-coffee-400">Your data is never sold. SATPeaK is free.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
