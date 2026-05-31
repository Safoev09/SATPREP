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
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user && !data.session) {
      // Email confirmation is on — tell them to check their email
      setError(
        "Check your email to confirm your account, then return here to sign in. (Or disable email confirmation in Supabase → Authentication → Providers for instant signup.)"
      );
      setLoading(false);
      return;
    }

    // Logged in immediately — go to onboarding
    router.push("/onboarding");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-lg bg-coffee-800 text-cream-50 grid place-items-center font-display italic font-bold">S</div>
            <span className="font-display font-semibold text-2xl text-coffee-800">SATPeaK</span>
          </Link>
          <p className="text-sm text-coffee-600">Create your account</p>
        </div>

        <div className="bg-cream-50 border border-coffee-700/10 rounded-2xl p-8 shadow-sm">
          <h1 className="font-display text-2xl font-semibold text-coffee-900 mb-1">
            Start your prep
          </h1>
          <p className="text-coffee-600 text-sm mb-6">
            Free preview unlocks the drills. Pay once for lifetime access to everything.
          </p>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label>Full name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Your name"
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
              <label>Password (min 6 characters)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div className="text-sm text-coffee-800 bg-cream-200 border border-coffee-700/20 rounded-lg p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-coffee-800 hover:bg-coffee-900 disabled:opacity-60 text-cream-50 font-medium py-3 rounded-full transition"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-coffee-600 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-coffee-800 font-medium hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
