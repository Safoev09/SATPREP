"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { BlockMath } from "react-katex";
import type { Question } from "@/lib/skills";
import RichText from "@/components/RichText";
import CalculatorPanel from "@/components/CalculatorPanel";
import ReferencePanel from "@/components/ReferencePanel";
import { RW_MODULE_MINUTES, MATH_MODULE_MINUTES, sectionScore } from "@/lib/sat-scoring";

const LETTERS = ["A", "B", "C", "D"] as const;

type Stage = "rw_m1" | "rw_m2" | "break" | "math_m1" | "math_m2" | "submitting";
type ModuleAnswers = Record<number, string>;

export default function FullTestRunner({
  sessionId,
  passages,
  rwModule1,
  rwModule2,
  mathModule1,
  mathModule2,
}: {
  sessionId: number;
  passages: Record<number, string>;
  rwModule1: Question[];
  rwModule2: Question[];
  mathModule1: Question[];
  mathModule2: Question[];
}) {
  const router = useRouter();
  const supabase = createClient();

  // Skip empty modules gracefully — find the first stage that has questions
  const firstStage: Stage =
    rwModule1.length > 0 ? "rw_m1"
    : rwModule2.length > 0 ? "rw_m2"
    : mathModule1.length > 0 ? "math_m1"
    : "math_m2";

  const [stage, setStage] = useState<Stage>(firstStage);
  const [current, setCurrent] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(
    firstStage.startsWith("rw") ? RW_MODULE_MINUTES * 60 : MATH_MODULE_MINUTES * 60
  );
  const [error, setError] = useState<string | null>(null);
  const [showCalc, setShowCalc] = useState(false);
  const [showRef, setShowRef] = useState(false);

  const [rwM1Answers, setRwM1Answers] = useState<ModuleAnswers>({});
  const [rwM2Answers, setRwM2Answers] = useState<ModuleAnswers>({});
  const [mathM1Answers, setMathM1Answers] = useState<ModuleAnswers>({});
  const [mathM2Answers, setMathM2Answers] = useState<ModuleAnswers>({});

  const activeQuestions: Question[] =
    stage === "rw_m1" ? rwModule1
    : stage === "rw_m2" ? rwModule2
    : stage === "math_m1" ? mathModule1
    : stage === "math_m2" ? mathModule2
    : [];

  const activeAnswers: ModuleAnswers =
    stage === "rw_m1" ? rwM1Answers
    : stage === "rw_m2" ? rwM2Answers
    : stage === "math_m1" ? mathM1Answers
    : stage === "math_m2" ? mathM2Answers
    : {};

  const setActiveAnswers = (qid: number, letter: string) => {
    const setter =
      stage === "rw_m1" ? setRwM1Answers
      : stage === "rw_m2" ? setRwM2Answers
      : stage === "math_m1" ? setMathM1Answers
      : setMathM2Answers;
    setter((prev) => ({ ...prev, [qid]: letter }));
  };

  const isMathStage = stage === "math_m1" || stage === "math_m2";
  const q = activeQuestions[current];

  useEffect(() => {
    if (stage === "break" || stage === "submitting") return;
    if (secondsLeft <= 0) {
      advanceStage();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, secondsLeft]);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const countCorrect = (questions: Question[], answers: ModuleAnswers) => {
    let n = 0;
    questions.forEach((qq) => {
      const picked = answers[qq.id];
      if (picked == null) return;
      if (qq.section === "math" && qq.spr_answer) {
        if (picked.trim() === qq.spr_answer.trim()) n++;
      } else if (picked === qq.correct_answer) {
        n++;
      }
    });
    return n;
  };

  const advanceStage = useCallback(() => {
    // Move to the next non-empty stage
    if (stage === "rw_m1") {
      if (rwModule2.length > 0) {
        setStage("rw_m2"); setCurrent(0); setSecondsLeft(RW_MODULE_MINUTES * 60);
      } else {
        setStage("break");
      }
    } else if (stage === "rw_m2") {
      setStage("break");
    } else if (stage === "math_m1") {
      if (mathModule2.length > 0) {
        setStage("math_m2"); setCurrent(0); setSecondsLeft(MATH_MODULE_MINUTES * 60);
      } else {
        submitTest();
      }
    } else if (stage === "math_m2") {
      submitTest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, rwModule2, mathModule2]);

  const startMath = () => {
    if (mathModule1.length > 0) {
      setStage("math_m1"); setCurrent(0); setSecondsLeft(MATH_MODULE_MINUTES * 60);
    } else if (mathModule2.length > 0) {
      setStage("math_m2"); setCurrent(0); setSecondsLeft(MATH_MODULE_MINUTES * 60);
    } else {
      submitTest();
    }
  };

  const submitTest = async () => {
    setStage("submitting");
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Not logged in."); return; }

    const rwCorrect = countCorrect(rwModule1, rwM1Answers) + countCorrect(rwModule2, rwM2Answers);
    const rwTotal = rwModule1.length + rwModule2.length;
    const mathCorrect = countCorrect(mathModule1, mathM1Answers) + countCorrect(mathModule2, mathM2Answers);
    const mathTotal = mathModule1.length + mathModule2.length;

    // Module 2 difficulty affects ceiling. We treat an admin full test's Module 2
    // as the "hard" path (full 800 reachable) since the admin curated it.
    const rwScore = sectionScore(rwCorrect, rwTotal, "hard");
    const mathScore = sectionScore(mathCorrect, mathTotal, "hard");
    const totalScore = rwScore + mathScore;

    const allRows: any[] = [];
    const pushModule = (questions: Question[], answers: ModuleAnswers) => {
      questions.forEach((qq) => {
        const picked = answers[qq.id] ?? null;
        let correct = false;
        if (picked != null) {
          if (qq.section === "math" && qq.spr_answer) {
            correct = picked.trim() === qq.spr_answer.trim();
          } else {
            correct = picked === qq.correct_answer;
          }
        }
        allRows.push({
          session_id: sessionId,
          user_id: user.id,
          question_id: qq.id,
          selected_answer: picked,
          is_correct: correct,
          time_spent_seconds: 0,
          flagged_for_review: false,
        });
      });
    };
    pushModule(rwModule1, rwM1Answers);
    pushModule(rwModule2, rwM2Answers);
    pushModule(mathModule1, mathM1Answers);
    pushModule(mathModule2, mathM2Answers);

    if (allRows.length > 0) {
      await supabase.from("answers").insert(allRows);
    }

    await supabase
      .from("sessions")
      .update({
        status: "completed",
        total_questions: rwTotal + mathTotal,
        correct_count: rwCorrect + mathCorrect,
        scaled_score: totalScore,
        completed_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    router.push(`/app/full-test/${sessionId}/results`);
    router.refresh();
  };

  // ===== BREAK =====
  if (stage === "break") {
    return (
      <div className="p-10 max-w-2xl">
        <div className="bg-cream-50 border border-coffee-700/10 rounded-3xl p-10 text-center">
          <div className="text-5xl mb-4">☕</div>
          <h1 className="font-display text-3xl font-semibold text-coffee-900 mb-3">
            Reading & Writing complete
          </h1>
          <p className="text-coffee-700 mb-2">Take your 10-minute break.</p>
          <p className="text-coffee-600 text-sm mb-7">
            When you're ready, the Math section begins.
          </p>
          <button
            onClick={startMath}
            className="bg-coffee-800 hover:bg-coffee-900 text-cream-50 px-8 py-3.5 rounded-full font-medium"
          >
            Start the Math section →
          </button>
        </div>
      </div>
    );
  }

  // ===== SUBMITTING =====
  if (stage === "submitting") {
    return (
      <div className="p-10 max-w-2xl">
        <div className="bg-cream-50 border border-coffee-700/10 rounded-3xl p-10 text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h1 className="font-display text-2xl font-semibold text-coffee-900 mb-2">
            Scoring your test…
          </h1>
          <p className="text-coffee-600">Calculating your 400–1600 score.</p>
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!q) return null;

  const isSPR = q.section === "math" && !!q.spr_answer;
  const moduleLabel =
    stage === "rw_m1" ? "Reading & Writing · Module 1"
    : stage === "rw_m2" ? "Reading & Writing · Module 2"
    : stage === "math_m1" ? "Math · Module 1"
    : "Math · Module 2";
  const answeredCount = activeQuestions.filter((qq) => activeAnswers[qq.id] != null).length;

  return (
    <div className="min-h-screen flex flex-col bg-cream-50">
      <header className="border-b border-coffee-700/15 bg-cream-100 px-6 py-3 flex items-center justify-between">
        <span className="font-display font-semibold text-coffee-900">{moduleLabel}</span>
        <div className={`font-mono font-medium px-3 py-1 rounded-full text-sm ${
          secondsLeft < 60 ? "bg-red-100 text-red-800" : "bg-coffee-800 text-cream-50"
        }`}>
          {fmt(secondsLeft)}
        </div>
        <div className="flex items-center gap-2">
          {isMathStage && (
            <>
              <button
                onClick={() => { setShowCalc(!showCalc); setShowRef(false); }}
                className={`text-sm px-3 py-1.5 rounded-lg ${showCalc ? "bg-coffee-800 text-cream-50" : "bg-cream-200 text-coffee-700 hover:bg-beige-300"}`}
              >
                🖩 Calculator
              </button>
              <button
                onClick={() => { setShowRef(!showRef); setShowCalc(false); }}
                className={`text-sm px-3 py-1.5 rounded-lg ${showRef ? "bg-coffee-800 text-cream-50" : "bg-cream-200 text-coffee-700 hover:bg-beige-300"}`}
              >
                📐 Reference
              </button>
            </>
          )}
          <span className="text-sm text-coffee-600">
            {answeredCount}/{activeQuestions.length}
          </span>
        </div>
      </header>

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
                value={activeAnswers[q.id] ?? ""}
                onChange={(e) => setActiveAnswers(q.id, e.target.value)}
                placeholder="Type your answer"
                style={{ maxWidth: "240px" }}
              />
            </div>
          ) : (
            <div className="space-y-2.5 mb-6">
              {LETTERS.map((letter) => {
                const choiceText = q[`choice_${letter.toLowerCase()}` as keyof Question] as string | null;
                if (!choiceText) return null;
                const selected = activeAnswers[q.id] === letter;
                return (
                  <button
                    key={letter}
                    onClick={() => setActiveAnswers(q.id, letter)}
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

      <footer className="border-t border-coffee-700/15 bg-cream-100 px-6 py-3 flex items-center justify-between">
        <button
          onClick={() => setCurrent(Math.max(0, current - 1))}
          disabled={current === 0}
          className="px-5 py-2 rounded-full text-sm font-medium text-coffee-700 hover:bg-cream-200 disabled:opacity-30"
        >
          ← Previous
        </button>
        <span className="text-sm text-coffee-600">{moduleLabel}</span>
        {current < activeQuestions.length - 1 ? (
          <button
            onClick={() => setCurrent(current + 1)}
            className="bg-coffee-800 hover:bg-coffee-900 text-cream-50 px-5 py-2 rounded-full text-sm font-medium"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={advanceStage}
            className="bg-green-700 hover:bg-green-800 text-cream-50 px-5 py-2 rounded-full text-sm font-medium"
          >
            {stage === "math_m2" || (stage === "math_m1" && mathModule2.length === 0)
              ? "Finish test ✓"
              : "Finish module →"}
          </button>
        )}
      </footer>

      {showCalc && <CalculatorPanel onClose={() => setShowCalc(false)} />}
      {showRef && <ReferencePanel onClose={() => setShowRef(false)} />}
    </div>
  );
}
