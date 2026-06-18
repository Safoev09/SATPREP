"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-client";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim() } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user && !data.session) {
      setError("Check your email to confirm your account, then return here to log in.");
      setLoading(false);
      return;
    }

    router.push("/onboarding");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background orbs */}
      <div className="absolute top-[-20%] right-[-10%] w-[32rem] h-[32rem] rounded-full bg-accent/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-5%] w-[28rem] h-[28rem] rounded-full bg-beige-300/20 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo — properly sized, with safe fallback to text mark */}
        <div className="text-center mb-7">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <div className="w-14 h-14 relative">
              <img
                src="/logo.png"
                alt="SATPeaK"
                className="w-14 h-14 object-contain rounded-2xl"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                  if (fallback) fallback.style.display = "flex";
                }}
              />
              <div className="w-14 h-14 rounded-2xl bg-coffee-800 text-cream-50 items-center justify-center font-display italic font-bold text-2xl hidden">
                S
              </div>
            </div>
            <span className="font-display font-semibold text-2xl text-coffee-900 tracking-tight">SATPeaK</span>
          </Link>
          <div className="mt-3 inline-flex items-center gap-1.5 bg-green-100 border border-green-300/60 text-green-800 text-xs font-semibold px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" />
            100% free — no payment needed
          </div>
        </div>

        <div className="bg-cream-50 border border-coffee-700/10 rounded-3xl p-8 shadow-sm">
          <h1 className="font-display text-2xl font-semibold text-coffee-900 mb-1">
            Create your account
          </h1>
          <p className="text-coffee-600 text-sm mb-6">
            Takes less than a minute. Your prep starts right after.
          </p>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label>Full name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="e.g. Akbar Safoev"
                autoComplete="name"
              />
            </div>

            <div>
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  style={{ paddingRight: "3.5rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-coffee-400 hover:text-coffee-700 transition"
                >
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
              {password.length > 0 && password.length < 6 && (
                <p className="text-xs text-red-600 mt-1">At least 6 characters required.</p>
              )}
            </div>

            {error && (
              <div className="text-sm text-coffee-800 bg-cream-200 border border-coffee-700/20 rounded-xl p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-coffee-800 hover:bg-coffee-900 disabled:opacity-60 text-cream-50 font-medium py-3 rounded-full transition mt-2"
            >
              {loading ? "Creating account…" : "Create account →"}
            </button>
          </form>

          <p className="text-center text-sm text-coffee-600 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-coffee-800 font-medium hover:underline">
              Log in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-coffee-400 mt-5">
          Your data is never sold. SATPeaK is completely free.
        </p>
      </div>
    </div>
  );
}
