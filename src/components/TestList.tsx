"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-client";
import type { Test } from "@/lib/tests";

export default function TestList({
  tests,
  hasLifetimeAccess,
  heading,
  intro,
}: {
  tests: (Test & { question_count: number })[];
  hasLifetimeAccess: boolean;
  heading: string;
  intro: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [starting, setStarting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startTest = async (test: Test) => {
    setStarting(test.id);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Not logged in.");
      setStarting(null);
      return;
    }

    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .insert({
        user_id: user.id,
        mode: test.test_type === "full" ? "full_test" : "module",
        section: test.section ?? "full",
        difficulty: test.difficulty,
        test_id: test.id,
        status: "in_progress",
      })
      .select()
      .single();

    if (sessionError || !session) {
      setError("Could not start: " + (sessionError?.message ?? ""));
      setStarting(null);
      return;
    }

    if (test.test_type === "full") {
      router.push(`/app/full-test/${session.id}`);
    } else {
      router.push(`/app/practice/${session.id}?fromTest=1`);
    }
  };

  const completedDuration = (count: number, type: string) => {
    if (type === "full") return "~2h 14m";
    const mins = Math.round(count * 1.4);
    return `~${mins} min`;
  };

  return (
    <div className="min-h-screen bg-cream-100">
      {/* ===== HERO ===== */}
      <div className="relative bg-coffee-900 text-cream-50 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-30%] right-[-5%] w-[32rem] h-[32rem] rounded-full bg-accent/15 blur-3xl" />
          <div className="absolute bottom-[-40%] left-[-5%] w-[28rem] h-[28rem] rounded-full bg-coffee-700/40 blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-8 py-12">
          <div className="text-accent text-xs font-semibold uppercase tracking-[0.2em] mb-2">Full-length practice</div>
          <h1 className="font-display text-4xl lg:text-5xl font-semibold leading-tight mb-3">{heading}</h1>
          <p className="text-cream-200/70 max-w-xl leading-relaxed">{intro}</p>

          <div className="flex items-center gap-6 mt-6">
            <div>
              <div className="font-display text-2xl font-semibold">{tests.length}</div>
              <div className="text-xs text-cream-200/50 uppercase tracking-wide">Tests available</div>
            </div>
            <div className="w-px h-10 bg-cream-50/15" />
            <div>
              <div className="font-display text-2xl font-semibold">100%</div>
              <div className="text-xs text-cream-200/50 uppercase tracking-wide">Free access</div>
            </div>
            <div className="w-px h-10 bg-cream-50/15" />
            <div className="flex items-center gap-1.5 bg-green-500/15 border border-green-400/30 text-green-300 text-xs font-semibold px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Real Bluebook interface
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-8">
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-2xl p-4 mb-5">{error}</div>
        )}

        {tests.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📭</div>
            <div className="font-display text-2xl font-semibold text-coffee-900 mb-2">No tests published yet</div>
            <p className="text-coffee-600 max-w-sm mx-auto">
              Once the admin publishes tests, they'll appear here ready to take.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {tests.map((test, i) => (
              <div
                key={test.id}
                className="group bg-cream-50 border border-coffee-700/10 rounded-3xl p-6 flex items-center gap-6 hover:border-accent/30 hover:shadow-md transition-all duration-200"
              >
                {/* Number badge */}
                <div className="w-14 h-14 rounded-2xl bg-coffee-800 text-cream-50 grid place-items-center font-display font-bold text-xl shrink-0 group-hover:bg-accent group-hover:text-coffee-900 transition-colors">
                  {String(i + 1).padStart(2, "0")}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-display font-semibold text-lg text-coffee-900">{test.title}</h3>
                    {test.test_type === "full" ? (
                      <span className="text-[10px] bg-coffee-100 text-coffee-700 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide">
                        Full exam
                      </span>
                    ) : (
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide">
                        Module
                      </span>
                    )}
                  </div>
                  {test.description && (
                    <p className="text-sm text-coffee-600 mb-2 line-clamp-1">{test.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-coffee-500">
                    <span className="flex items-center gap-1">
                      📝 {test.question_count} question{test.question_count === 1 ? "" : "s"}
                    </span>
                    <span className="flex items-center gap-1">
                      ⏱️ {completedDuration(test.question_count, test.test_type)}
                    </span>
                    {test.difficulty && (
                      <span className="flex items-center gap-1 capitalize">
                        📊 {test.difficulty}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => startTest(test)}
                  disabled={starting === test.id}
                  className="shrink-0 bg-coffee-800 hover:bg-coffee-900 disabled:opacity-50 text-cream-50 px-6 py-3 rounded-full text-sm font-semibold transition flex items-center gap-2"
                >
                  {starting === test.id ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-cream-50/40 border-t-cream-50 rounded-full animate-spin" />
                      Starting…
                    </>
                  ) : (
                    <>Start →</>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10">
          <Link href="/app" className="text-coffee-700 hover:text-coffee-900 text-sm font-medium">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
