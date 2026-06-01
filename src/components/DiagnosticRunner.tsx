"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { BlockMath } from "react-katex";
import type { Question } from "@/lib/skills";
import RichText from "@/components/RichText";
import ExamShield from "@/components/ExamShield";

const LETTERS = ["A", "B", "C", "D"] as const;
const SECTION_SECONDS = 15 * 60; // 15 minutes per section

type Phase = "intro" | "rw" | "break" | "math" | "submitting";

export default function DiagnosticRunner({
  questions,
  passages,
  alreadyCompleted,
}: {
  questions: Question[];
  passages: Record<number, string>;
  alreadyCompleted: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();

  const rwQuestions = questions.filter((q) => q.section === "reading_writing");
  const mathQuestions = questions.filter((q) => q.section === "math");

  const [phase, setPhase] = useState<Phase>("intro");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [secondsLeft, setSecondsLeft] = useState(SECTION_SECONDS);
  const [error, setError] = useState<string | null>(null);

  const activeQuestions =
    phase === "rw" ? rwQuestions : phase === "math" ? mathQuestions : [];
  const q = activeQuestions[current];

  // Timer for the active section
  useEffect(() => {
    if (phase !== "rw" && phase !== "math") return;
    if (secondsLeft <= 0) {
      advanceSection();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, secondsLeft]);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const startTest = () => {
    setPhase("rw");
    setCurrent(0);
    setSecondsLeft(SECTION_SECONDS);
  };

  const advanceSection = () => {
    if (phase === "rw") {
      setPhase("break");
    } else if (phase === "math") {
      submitDiagnostic();
    }
  };

  const startMath = () => {
    setPhase("math");
    setCurrent(0);
    setSecondsLeft(SECTION_SECONDS);
  };

  const pick = (questionId: number, letter: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: letter }));
  };

  const submitDiagnostic = async () => {
    setPhase("submitting");
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Not logged in.");
      return;
    }

    // Create the diagnostic session
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .insert({
        user_id: user.id,
        mode: "diagnostic",
        section: "full",
        status: "completed",
        total_questions: questions.length,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (sessionError || !session) {
      setError("Could not save the diagnostic: " + (sessionError?.message ?? ""));
      setPhase("math");
      return;
    }

    // Build answer rows
    let correctCount = 0;
    const rows = questions.map((question) => {
      const picked = answers[question.id] ?? null;
      let correct = false;
      if (picked != null) {
        if (question.section === "math" && question.spr_answer) {
          correct = picked.trim() === question.spr_answer.trim();
        } else {
          correct = picked === question.correct_answer;
        }
      }
      if (correct) correctCount++;
      return {
        session_id: session.id,
        user_id: user.id,
        question_id: question.id,
        selected_answer: picked,
        is_correct: correct,
        time_spent_seconds: 0,
        flagged_for_review: false,
      };
    });

    await supabase.from("answers").insert(rows);

    await supabase
      .from("sessions")
      .update({ correct_count: correctCount })
      .eq("id", session.id);

    // Mark diagnostic complete on the profile
    await supabase
      .from("profiles")
      .update({ diagnostic_completed: true })
      .eq("id", user.id);

    // Award XP + update streak
    const { awardProgress, calculateXp } = await import("@/lib/gamification");
    await awardProgress({
      userId: user.id,
      xpEarned: calculateXp(correctCount, "diagnostic"),
    });

    router.push(`/app/diagnostic/results?session=${session.id}`);
    router.refresh();
  };

  // ===== INTRO =====
  if (phase === "intro") {
    return (
      <div className="p-10 max-w-2xl">
        <div className="bg-cream-50 border border-coffee-700/10 rounded-3xl p-10">
          <div className="text-5xl mb-4">📋</div>
          <h1 className="font-display text-3xl font-semibold text-coffee-900 mb-3">
            Your diagnostic test
          </h1>
          {alreadyCompleted && (
            <div className="bg-cream-200 text-coffee-800 text-sm rounded-lg p-3 mb-4">
              You've taken the diagnostic before. Taking it again will create a new result.
            </div>
          )}
          <p className="text-coffee-700 mb-4">
            This quick diagnostic shows where you stand today and what to focus on.
            Here's how it works:
          </p>
          <ul className="space-y-2 mb-6 text-coffee-700 text-sm">
            <li>📖 <strong>Part 1 — Reading & Writing:</strong> {rwQuestions.length} questions, 15 minutes</li>
            <li>🧮 <strong>Part 2 — Math:</strong> {mathQuestions.length} questions, 15 minutes</li>
            <li>⏱️ Each part is timed. When time runs out, it moves on automatically.</li>
            <li>📊 At the end you'll get an estimated score and a skill-by-skill breakdown.</li>
          </ul>
          <p className="text-coffee-600 text-sm mb-7">
            Find a quiet spot — once you start, the timer runs. Answer as many as you can.
          </p>
          <button
            onClick={startTest}
            className="bg-coffee-800 hover:bg-coffee-900 text-cream-50 px-8 py-3.5 rounded-full font-medium"
          >
            Start the diagnostic →
          </button>
        </div>
      </div>
    );
  }

  // ===== BREAK =====
  if (phase === "break") {
    return (
      <div className="p-10 max-w-2xl">
        <div className="bg-cream-50 border border-coffee-700/10 rounded-3xl p-10 text-center">
          <div className="text-5xl mb-4">☕</div>
          <h1 className="font-display text-3xl font-semibold text-coffee-900 mb-3">
            Part 1 complete — nice work!
          </h1>
          <p className="text-coffee-700 mb-7">
            Take a breath. When you're ready, start Part 2: Math ({mathQuestions.length} questions, 15 minutes).
          </p>
          <button
            onClick={startMath}
            className="bg-coffee-800 hover:bg-coffee-900 text-cream-50 px-8 py-3.5 rounded-full font-medium"
          >
            Start Part 2: Math →
          </button>
        </div>
      </div>
    );
  }

  // ===== SUBMITTING =====
  if (phase === "submitting") {
    return (
      <div className="p-10 max-w-2xl">
        <div className="bg-cream-50 border border-coffee-700/10 rounded-3xl p-10 text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h1 className="font-display text-2xl font-semibold text-coffee-900 mb-2">
            Scoring your diagnostic…
          </h1>
          <p className="text-coffee-600">Hang tight, this only takes a moment.</p>
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== ACTIVE TEST (rw or math) =====
  if (!q) return null;
  const isSPR = q.section === "math" && !!q.spr_answer;
  const sectionLabel = phase === "rw" ? "Reading & Writing" : "Math";
  const answeredCount = activeQuestions.filter((qq) => answers[qq.id] != null).length;

  return (
    <>
      <ExamShield
        mode="strict"
        threshold={2}
        onThresholdReached={() => submitDiagnostic()}
      />
    <div className="min-h-screen flex flex-col bg-cream-50">
      {/* Top bar */}
      <header className="border-b border-coffee-700/15 bg-cream-100 px-6 py-3 flex items-center justify-between">
        <span className="font-display font-semibold text-coffee-900">
          Diagnostic · {sectionLabel}
        </span>
        <div className={`font-mono font-medium px-3 py-1 rounded-full text-sm ${
          secondsLeft < 60 ? "bg-red-100 text-red-800" : "bg-coffee-800 text-cream-50"
        }`}>
          {fmt(secondsLeft)}
        </div>
        <span className="text-sm text-coffee-600">
          {answeredCount} / {activeQuestions.length} answered
        </span>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {q.passage_id && passages[q.passage_id] && (
          <div className="w-1/2 border-r border-coffee-700/15 overflow-y-auto p-8">
            <div className="text-xs text-coffee-600 uppercase tracking-wider mb-3">Passage</div>
            <div className="text-coffee-800 leading-relaxed whitespace-pre-wrap">
              {passages[q.passage_id]}
            </div>
          </div>
        )}
        <div className={`${q.passage_id ? "w-1/2" : "w-full max-w-3xl mx-auto"} overflow-y-auto p-8`}>
          <div className="mb-5">
            <span className="bg-coffee-800 text-cream-50 font-medium text-sm px-3 py-1 rounded-lg">
              Question {current + 1} of {activeQuestions.length}
            </span>
          </div>

          <div className="font-display text-lg text-coffee-900 leading-relaxed mb-4">
            <RichText text={q.prompt} />
          </div>

          {q.prompt_latex && (
            <div className="bg-cream-100 rounded-lg p-4 mb-4 overflow-x-auto">
              <BlockMath math={q.prompt_latex} errorColor="#cc0000" />
            </div>
          )}

          {q.prompt_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={q.prompt_image_url} alt="Figure" className="max-w-full rounded-lg border border-coffee-700/10 mb-4" />
          )}

          {isSPR ? (
            <div className="mb-6">
              <label>Your answer</label>
              <input
                type="text"
                value={answers[q.id] ?? ""}
                onChange={(e) => pick(q.id, e.target.value)}
                placeholder="Type your answer"
                style={{ maxWidth: "240px" }}
              />
            </div>
          ) : (
            <div className="space-y-2.5 mb-6">
              {LETTERS.map((letter) => {
                const choiceText = q[`choice_${letter.toLowerCase()}` as keyof Question] as string | null;
                if (!choiceText) return null;
                const selected = answers[q.id] === letter;
                return (
                  <button
                    key={letter}
                    onClick={() => pick(q.id, letter)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition text-left ${
                      selected
                        ? "border-coffee-800 bg-cream-200"
                        : "border-coffee-700/15 bg-cream-50 hover:border-beige-400"
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-full grid place-items-center text-sm font-semibold shrink-0 ${
                      selected ? "bg-coffee-800 text-cream-50" : "bg-cream-100 border-2 border-coffee-700 text-coffee-800"
                    }`}>
                      {letter}
                    </span>
                    <span className="text-coffee-800"><RichText text={choiceText} /></span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <footer className="border-t border-coffee-700/15 bg-cream-100 px-6 py-3 flex items-center justify-between">
        <button
          onClick={() => setCurrent(Math.max(0, current - 1))}
          disabled={current === 0}
          className="px-5 py-2 rounded-full text-sm font-medium text-coffee-700 hover:bg-cream-200 disabled:opacity-30"
        >
          ← Previous
        </button>
        <span className="text-sm text-coffee-600">
          {phase === "rw" ? "Part 1 of 2" : "Part 2 of 2"}
        </span>
        {current < activeQuestions.length - 1 ? (
          <button
            onClick={() => setCurrent(current + 1)}
            className="bg-coffee-800 hover:bg-coffee-900 text-cream-50 px-5 py-2 rounded-full text-sm font-medium"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={advanceSection}
            className="bg-green-700 hover:bg-green-800 text-cream-50 px-5 py-2 rounded-full text-sm font-medium"
          >
            {phase === "rw" ? "Finish Part 1 →" : "Finish & see results ✓"}
          </button>
        )}
      </footer>
    </div>
    </>
  );
}
