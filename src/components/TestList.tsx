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
    if (test.visibility === "premium" && !hasLifetimeAccess) {
      router.push("/app/upgrade");
      return;
    }
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

  return (
    <div className="p-10 max-w-4xl">
      <h1 className="font-display text-3xl font-semibold text-coffee-900 mb-1">
        {heading}
      </h1>
      <p className="text-coffee-600 mb-8">{intro}</p>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      {tests.length === 0 ? (
        <div className="bg-cream-50 border border-coffee-700/10 rounded-2xl p-12 text-center">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-coffee-600">
            No tests available yet. Once the site owner publishes tests in the
            admin panel, they'll appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tests.map((test) => {
            const locked = test.visibility === "premium" && !hasLifetimeAccess;
            return (
              <div
                key={test.id}
                className="bg-cream-50 border border-coffee-700/10 rounded-2xl p-5 flex items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-semibold text-lg text-coffee-900">
                      {test.title}
                    </h3>
                    {test.visibility === "premium" ? (
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-medium">
                        PREMIUM
                      </span>
                    ) : (
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full font-medium">
                        FREE
                      </span>
                    )}
                  </div>
                  {test.description && (
                    <p className="text-sm text-coffee-600 mt-0.5">{test.description}</p>
                  )}
                  <div className="text-xs text-coffee-600 mt-1">
                    {test.question_count} question{test.question_count === 1 ? "" : "s"}
                    {test.difficulty ? ` · ${test.difficulty}` : ""}
                  </div>
                </div>
                <button
                  onClick={() => startTest(test)}
                  disabled={starting === test.id}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
                    locked
                      ? "bg-cream-200 text-coffee-700 hover:bg-beige-300"
                      : "bg-coffee-800 hover:bg-coffee-900 text-cream-50"
                  }`}
                >
                  {starting === test.id
                    ? "Starting…"
                    : locked
                    ? "🔒 Unlock"
                    : "Start →"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8">
        <Link href="/app" className="text-coffee-700 hover:text-coffee-900 text-sm">
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}
