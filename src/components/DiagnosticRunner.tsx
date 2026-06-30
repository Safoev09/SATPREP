"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { BlockMath } from "react-katex";
import type { Question } from "@/lib/skills";
import RichText from "@/components/RichText";
import ExamShield from "@/components/ExamShield";
import CalculatorPanel from "@/components/CalculatorPanel";
import ReferencePanel from "@/components/ReferencePanel";

const LETTERS = ["A", "B", "C", "D"] as const;
const SECTION_SECONDS = 15 * 60; // 15 minutes per section

type Phase = "intro" | "rw" | "break" | "math" | "submitting";

type DiagAnswerState = {
  selected: string | null;
  struck: string[];
  flagged: boolean;
};

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
  const [answers, setAnswers] = useState<Record<number, DiagAnswerState>>({});
  const [secondsLeft, setSecondsLeft] = useState(SECTION_SECONDS);
  const [error, setError] = useState<string | null>(null);
  const [showCalc, setShowCalc] = useState(false);
  const [showRef, setShowRef] = useState(false);
  const [highlightOn, setHighlightOn] = useState(false);
  const [passageFocused, setPassageFocused] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeQuestions =
    phase === "rw" ? rwQuestions : phase === "math" ? mathQuestions : [];
  const q = activeQuestions[current];

  const getAns = (questionId: number): DiagAnswerState =>
    answers[questionId] ?? { selected: null, struck: [], flagged: false };

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
    setShowCalc(false);
    setShowRef(false);
  };

  const pick = (questionId: number, letter: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...getAns(questionId), selected: letter },
    }));
  };

  const toggleStrike = (questionId: number, letter: string) => {
    const cur = getAns(questionId);
    const struck = cur.struck.includes(letter)
      ? cur.struck.filter((l) => l !== letter)
      : [...cur.struck, letter];
    setAnswers((prev) => ({ ...prev, [questionId]: { ...cur, struck } }));
  };

  const toggleFlag = (questionId: number) => {
    const cur = getAns(questionId);
    setAnswers((prev) => ({ ...prev, [questionId]: { ...cur, flagged: !cur.flagged } }));
  };

  const submitDiagnostic = async () => {
    setPhase("submitting");
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Not logged in.");
      return;
    }

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

    let correctCount = 0;
    const rows = questions.map((question) => {
      const ans = getAns(question.id);
      const picked = ans.selected;
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
        flagged_for_review: ans.flagged,
      };
    });

    await supabase.from("answers").insert(rows);

    await supabase
      .from("sessions")
      .update({ correct_count: correctCount })
      .eq("id", session.id);

    await supabase
      .from("profiles")
      .update({ diagnostic_completed: true })
      .eq("id", user.id);

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
            It runs in the same Bluebook-style interface as the real exam, so you'll have
            the calculator, reference sheet, highlighter, and answer elimination tools available.
          </p>
          <ul className="space-y-2 mb-6 text-coffee-700 text-sm">
            <li>📖 <strong>Part 1 — Reading & Writing:</strong> {rwQuestions.length} questions, 15 minutes</li>
            <li>🧮 <strong>Part 2 — Math:</strong> {mathQuestions.length} questions, 15 minutes · calculator available</li>
            <li>⏱️ Each part is timed. When time runs out, it moves on automatically.</li>
            <li>📊 At the end you'll get an estimated score and a full Mistake DNA breakdown.</li>
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
            Take a breath. When you're ready, start Part 2: Math ({mathQuestions.length} questions, 15 minutes, calculator included).
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
          <p className="text-coffee-600">Building your Mistake DNA profile — hang tight.</p>
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
  const answeredCount = activeQuestions.filter((qq) => getAns(qq.id).selected != null).length;
  const ans = getAns(q.id);
  const hasPassage = q.section === "reading_writing" && !!q.passage_id && !!passages[q.passage_id];

  return (
    <>
      <ExamShield
        mode="strict"
        threshold={2}
        onThresholdReached={() => submitDiagnostic()}
      />
      <div className="min-h-screen flex flex-col bg-cream-50">
        {/* Top bar — Bluebook style */}
        <header className="border-b border-coffee-700/15 bg-cream-100 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-display font-semibold text-coffee-900">
              Diagnostic · {sectionLabel}
            </span>
          </div>
          <div className={`font-mono font-medium px-3 py-1 rounded-full text-sm ${
            secondsLeft < 60 ? "bg-red-100 text-red-800" : "bg-coffee-800 text-cream-50"
          }`}>
            {fmt(secondsLeft)}
          </div>
          <div className="flex items-center gap-2">
            {phase === "math" && (
              <>
                <button
                  onClick={() => { setShowCalc(!showCalc); setShowRef(false); }}
                  className={`text-sm px-3 py-1.5 rounded-lg transition ${
                    showCalc ? "bg-coffee-800 text-cream-50" : "bg-cream-200 text-coffee-700 hover:bg-beige-300"
                  }`}
                >
                  🖩 Calculator
                </button>
                <button
                  onClick={() => { setShowRef(!showRef); setShowCalc(false); }}
                  className={`text-sm px-3 py-1.5 rounded-lg transition ${
                    showRef ? "bg-coffee-800 text-cream-50" : "bg-cream-200 text-coffee-700 hover:bg-beige-300"
                  }`}
                >
                  📐 Reference
                </button>
              </>
            )}
            {phase === "rw" && hasPassage && (
              <button
                onClick={() => setHighlightOn(!highlightOn)}
                className={`text-sm px-3 py-1.5 rounded-lg transition ${
                  highlightOn ? "bg-yellow-300 text-coffee-900" : "bg-cream-200 text-coffee-700 hover:bg-beige-300"
                }`}
              >
                ✏️ Highlighter {highlightOn ? "on" : "off"}
              </button>
            )}
            <span className="text-sm text-coffee-600 ml-1">
              {answeredCount}/{activeQuestions.length} answered
            </span>
          </div>
        </header>

        {/* Body — true Bluebook split: question always left, choices always right */}
        <div className="flex-1 flex overflow-hidden">
          <div
            onMouseEnter={() => setPassageFocused(true)}
            onMouseLeave={() => setPassageFocused(false)}
            className="w-1/2 border-r border-coffee-700/15 overflow-y-auto p-8 bg-cream-50"
          >
            {hasPassage ? (
              <>
                <div className="text-xs text-coffee-600 uppercase tracking-wider mb-3 font-semibold">Passage</div>
                <DiagPassage
                  text={passages[q.passage_id!]}
                  highlightEnabled={highlightOn}
                  userId={userId}
                />
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <span className="bg-coffee-800 text-cream-50 font-medium text-sm px-3 py-1 rounded-lg">
                    Question {current + 1} of {activeQuestions.length}
                  </span>
                  <button
                    onClick={() => toggleFlag(q.id)}
                    className={`text-sm px-2.5 py-1 rounded-lg transition ${
                      ans.flagged ? "bg-yellow-300 text-coffee-900" : "bg-cream-200 text-coffee-600 hover:bg-beige-300"
                    }`}
                  >
                    {ans.flagged ? "🚩 Marked" : "⚐ Mark for review"}
                  </button>
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
              </>
            )}
          </div>

          <div className={`w-1/2 overflow-y-auto p-8 transition-opacity duration-300 ${passageFocused ? "opacity-60" : "opacity-100"}`}>
            {hasPassage && (
              <>
                <div className="flex items-center justify-between mb-5">
                  <span className="bg-coffee-800 text-cream-50 font-medium text-sm px-3 py-1 rounded-lg">
                    Question {current + 1} of {activeQuestions.length}
                  </span>
                  <button
                    onClick={() => toggleFlag(q.id)}
                    className={`text-sm px-2.5 py-1 rounded-lg transition ${
                      ans.flagged ? "bg-yellow-300 text-coffee-900" : "bg-cream-200 text-coffee-600 hover:bg-beige-300"
                    }`}
                  >
                    {ans.flagged ? "🚩 Marked" : "⚐ Mark for review"}
                  </button>
                </div>

                <div className="font-display text-lg text-coffee-900 leading-relaxed mb-4">
                  <RichText text={q.prompt} />
                </div>

                {q.prompt_latex && (
                  <div className="bg-cream-100 rounded-lg p-4 mb-4 overflow-x-auto">
                    <BlockMath math={q.prompt_latex} errorColor="#cc0000" />
                  </div>
                )}
              </>
            )}

            {isSPR ? (
              <div className="mb-6">
                <label>Your answer</label>
                <input
                  type="text"
                  value={ans.selected ?? ""}
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
                  const selected = ans.selected === letter;
                  const struck = ans.struck.includes(letter);
                  return (
                    <div key={letter} className="flex items-center gap-2">
                      <button
                        onClick={() => pick(q.id, letter)}
                        className={`flex-1 flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all duration-200 text-left ${
                          selected ? "border-coffee-800 bg-cream-200" : "border-coffee-700/15 bg-cream-50 hover:border-beige-400"
                        } ${struck ? "opacity-40" : "hover:scale-[1.01] hover:shadow-sm"}`}
                      >
                        <span className={`w-7 h-7 rounded-full grid place-items-center text-sm font-semibold shrink-0 ${
                          selected ? "bg-coffee-800 text-cream-50" : "bg-cream-100 border-2 border-coffee-700 text-coffee-800"
                        }`}>
                          {letter}
                        </span>
                        <span className={`text-coffee-800 ${struck ? "line-through" : ""}`}>
                          <RichText text={choiceText} />
                        </span>
                      </button>
                      <button
                        onClick={() => toggleStrike(q.id, letter)}
                        title="Eliminate this choice"
                        className="w-8 h-8 rounded-lg bg-cream-100 hover:bg-cream-200 text-coffee-600 text-xs font-bold shrink-0 transition"
                      >
                        {struck ? "↺" : "✕"}
                      </button>
                    </div>
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

      {showCalc && <CalculatorPanel onClose={() => setShowCalc(false)} />}
      {showRef && <ReferencePanel onClose={() => setShowRef(false)} />}
    </>
  );
}

// ---- Passage with click-drag highlighting (diagnostic version) ----
function DiagPassage({
  text,
  highlightEnabled,
  userId,
}: {
  text: string;
  highlightEnabled: boolean;
  userId: string | null;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [savedToast, setSavedToast] = useState<string | null>(null);

  const handleMouseUp = () => {
    if (!highlightEnabled) return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !ref.current) return;
    const range = selection.getRangeAt(0);
    if (!ref.current.contains(range.commonAncestorContainer)) return;
    try {
      const mark = document.createElement("mark");
      mark.style.backgroundColor = "#FDE68A";
      mark.style.padding = "0 1px";
      range.surroundContents(mark);
      selection.removeAllRanges();
    } catch {
      // surroundContents fails across element boundaries — ignore
    }
  };

  const handleDoubleClick = async () => {
    if (!userId) return;
    const sel = window.getSelection()?.toString().trim();
    if (!sel) return;
    const cleaned = sel.replace(/[^a-zA-Z\-']/g, "");
    if (!cleaned || cleaned.length < 2 || cleaned.length > 40) return;

    const word = cleaned.toLowerCase();
    const { lookupWord } = await import("@/lib/dictionary");
    const { createClient } = await import("@/lib/supabase-client");
    const supabase = createClient();

    const entry = await lookupWord(word);

    const { error } = await supabase.from("user_vocab").insert({
      user_id: userId,
      word,
      definition: entry?.definition ?? "(definition not auto-found — edit in Vocabulary)",
      example: entry?.example ?? null,
      source_type: "highlight",
    });

    if (!error) {
      setSavedToast(`✓ Saved "${word}" to vocabulary`);
      setTimeout(() => setSavedToast(null), 2500);
    } else if (error.code === "23505") {
      setSavedToast(`"${word}" is already in your vocabulary`);
      setTimeout(() => setSavedToast(null), 2500);
    }
  };

  return (
    <>
      <div
        ref={ref}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        className={`text-coffee-800 leading-relaxed whitespace-pre-wrap select-text ${highlightEnabled ? "cursor-text" : ""}`}
        style={{ userSelect: "text" }}
        title="Double-click a word to save it to your vocabulary"
      >
        {text}
      </div>
      {savedToast && (
        <div className="fixed bottom-6 right-6 z-50 glass rounded-2xl px-5 py-3 text-sm text-coffee-900 animate-[fadeup_0.3s_ease-out]">
          {savedToast}
        </div>
      )}
    </>
  );
}
