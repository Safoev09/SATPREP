"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    // Check profile to decide where to send them
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin, target_score, region, target_exam_date")
      .eq("id", data.user.id)
      .single();

    if (profile?.is_admin) {
      router.push("/admin");
    } else if (!profile?.target_score || !profile?.region || !profile?.target_exam_date) {
      router.push("/onboarding");
    } else {
      router.push("/app");
    }
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-lg bg-coffee-800 text-cream-50 grid place-items-center font-display italic font-bold">S</div>
            <span className="font-display font-semibold text-2xl text-coffee-800">SATPrep</span>
          </Link>
          <p className="text-sm text-coffee-600">Welcome back</p>
        </div>

        <div className="bg-cream-50 border border-coffee-700/10 rounded-2xl p-8 shadow-sm">
          <h1 className="font-display text-2xl font-semibold text-coffee-900 mb-1">
            Sign in
          </h1>
          <p className="text-coffee-600 text-sm mb-6">
            Pick up where you left off.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
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
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-coffee-800 hover:bg-coffee-900 disabled:opacity-60 text-cream-50 font-medium py-3 rounded-full transition"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-coffee-600 mt-6">
            New here?{" "}
            <Link href="/signup" className="text-coffee-800 font-medium hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
