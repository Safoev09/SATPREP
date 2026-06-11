"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { BlockMath } from "react-katex";
import type { Question } from "@/lib/skills";
import { getSkillLabel } from "@/lib/skills";
import RichText from "@/components/RichText";
import CalculatorPanel from "@/components/CalculatorPanel";
import ReferencePanel from "@/components/ReferencePanel";
import ExamShield from "@/components/ExamShield";
import ShareQuestionModal from "@/components/ShareQuestionModal";

type AnswerState = {
  selected: string | null;       // "A"/"B"/"C"/"D" or typed SPR value
  struck: string[];              // eliminated choices
  flagged: boolean;               // marked for review
  submitted: boolean;             // submitted (practice mode reveals after this)
  bookmarked: boolean;
  timeSpent: number;
};

const LETTERS = ["A", "B", "C", "D"] as const;

export default function PracticeRunner({
  sessionId,
  section,
  skill,
  practiceMode,
  questions,
  passages,
  timeLimitSeconds,
  mode = "drill",
}: {
  sessionId: number;
  section: "reading_writing" | "math";
  skill: string;
  practiceMode: "practice" | "test";
  questions: Question[];
  passages: Record<number, string>;
  timeLimitSeconds: number | null;
  mode?: "drill" | "module";
}) {
  const router = useRouter();
  const supabase = createClient();

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<AnswerState[]>(
    questions.map(() => ({
      selected: null,
      struck: [],
      flagged: false,
      submitted: false,
      bookmarked: false,
      timeSpent: 0,
    }))
  );
  const [showCalc, setShowCalc] = useState(false);
  const [showRef, setShowRef] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [violations, setViolations] = useState<any[]>([]);
  const [timerHidden, setTimerHidden] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [shareModal, setShareModal] = useState<{
    questionId: number;
    prompt: string;
    answer: string;
    correct: boolean;
  } | null>(null);

  // Highlighter state — per-question saved ranges of the passage (simple: stored text offsets)
  const [highlightOn, setHighlightOn] = useState(false);
  // Reading focus — when true, the question panel dims to help the student lock in on the passage
  const [passageFocused, setPassageFocused] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Load current user id once on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const q = questions[current];
  const a = answers[current];
  const isSPR = section === "math" && !!q.spr_answer;

  // Timer
  useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Per-question time tracking
  const questionStartRef = useRef(Date.now());
  useEffect(() => {
    questionStartRef.current = Date.now();
  }, [current]);

  const remaining = timeLimitSeconds ? Math.max(0, timeLimitSeconds - elapsed) : null;

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const updateAnswer = (patch: Partial<AnswerState>) => {
    setAnswers((prev) =>
      prev.map((ans, i) => (i === current ? { ...ans, ...patch } : ans))
    );
  };

  const selectChoice = (letter: string) => {
    if (a.submitted && practiceMode === "practice") return; // locked after submit in practice
    updateAnswer({ selected: letter });
  };

  const toggleStrike = (letter: string) => {
    const struck = a.struck.includes(letter)
      ? a.struck.filter((l) => l !== letter)
      : [...a.struck, letter];
    updateAnswer({ struck });
  };

  const submitPractice = async () => {
    if (a.selected == null) return;
    const timeSpent = Math.round((Date.now() - questionStartRef.current) / 1000);
    updateAnswer({ submitted: true, timeSpent });
  };

  const toggleBookmark = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (a.bookmarked) {
      await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", user.id)
        .eq("question_id", q.id);
    } else {
      await supabase
        .from("bookmarks")
        .insert({ user_id: user.id, question_id: q.id });
    }
    updateAnswer({ bookmarked: !a.bookmarked });
  };

  const isCorrect = (ans: AnswerState, question: Question) => {
    if (ans.selected == null) return false;
    if (section === "math" && question.spr_answer) {
      return ans.selected.trim() === question.spr_answer.trim();
    }
    return ans.selected === question.correct_answer;
  };

  const goNext = () => {
    if (current < questions.length - 1) setCurrent(current + 1);
  };
  const goPrev = () => {
    if (current > 0) setCurrent(current - 1);
  };

  const finishDrill = useCallback(async () => {
    setFinishing(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setFinishing(false);
      return;
    }

    // Save every answer
    let correctCount = 0;
    const answerRows = questions.map((question, i) => {
      const ans = answers[i];
      const correct = isCorrect(ans, question);
      if (correct) correctCount++;
      return {
        session_id: sessionId,
        user_id: user.id,
        question_id: question.id,
        selected_answer: ans.selected,
        is_correct: correct,
        time_spent_seconds: ans.timeSpent,
        flagged_for_review: ans.flagged,
      };
    });

    await supabase.from("answers").insert(answerRows);

    // For modules, compute a scaled 200-800 score
    let scaledScore: number | null = null;
    if (mode === "module") {
      const { standaloneModuleScore } = await import("@/lib/sat-scoring");
      // Difficulty is reflected in the questions themselves; use "mixed" ceiling as default.
      // The hardest question difficulty present hints at the module's overall level.
      const hasHard = questions.some((q) => q.difficulty === "hard");
      const allEasy = questions.every((q) => q.difficulty === "easy");
      const level = hasHard ? "hard" : allEasy ? "easy" : "medium";
      scaledScore = standaloneModuleScore(correctCount, questions.length, level);
    }

    // Update the session
    await supabase
      .from("sessions")
      .update({
        status: "completed",
        total_questions: questions.length,
        correct_count: correctCount,
        scaled_score: scaledScore,
        time_spent_seconds: elapsed,
        violations: violations.length > 0 ? violations : null,
        completed_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    // Award XP + update streak
    const { awardProgress, calculateXp } = await import("@/lib/gamification");
    await awardProgress({
      userId: user.id,
      xpEarned: calculateXp(correctCount, mode),
    });

    router.push(`/app/practice/${sessionId}/results`);
    router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, questions, elapsed, sessionId, mode]);

  // Auto-finish when the timer runs out
  useEffect(() => {
    if (remaining === 0 && !finishing) {
      finishDrill();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  const answeredCount = answers.filter((x) => x.selected != null).length;
  const showResult = practiceMode === "practice" && a.submitted;

  return (
    <>
      <ExamShield
        mode={mode === "module" ? "strict" : "focus"}
        threshold={2}
        onViolation={(_v, all) => setViolations(all)}
        onThresholdReached={() => {
          // For modules, auto-submit. For drills (focus mode), just keep warning.
          if (mode === "module") {
            submitPractice();
          }
        }}
      />
    <div className="min-h-screen flex flex-col bg-cream-50">
      {/* ===== TOP BAR ===== */}
      <header className="border-b border-coffee-700/15 bg-cream-100 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-display font-semibold text-coffee-900">
            {section === "math" ? "Math" : "R&W"} {mode === "module" ? "module" : "drill"}
          </span>
          <span className="text-sm text-coffee-600">
            {mode === "module" ? skill : getSkillLabel(skill)}
          </span>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-3">
          {!timerHidden && (
            <div className={`font-mono font-medium px-3 py-1 rounded-full text-sm ${
              remaining !== null && remaining < 60
                ? "bg-red-100 text-red-800"
                : "bg-coffee-800 text-cream-50"
            }`}>
              {remaining !== null ? fmtTime(remaining) : fmtTime(elapsed)}
            </div>
          )}
          <button
            onClick={() => setTimerHidden(!timerHidden)}
            className="text-xs text-coffee-600 hover:text-coffee-900"
          >
            {timerHidden ? "Show timer" : "Hide timer"}
          </button>
        </div>

        {/* Tools */}
        <div className="flex items-center gap-2">
          {section === "math" && (
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
          {section === "reading_writing" && q.passage_id && (
            <button
              onClick={() => setHighlightOn(!highlightOn)}
              className={`text-sm px-3 py-1.5 rounded-lg transition ${
                highlightOn ? "bg-yellow-300 text-coffee-900" : "bg-cream-200 text-coffee-700 hover:bg-beige-300"
              }`}
            >
              ✏️ Highlighter {highlightOn ? "on" : "off"}
            </button>
          )}
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: passage (R&W) or nothing (Math) */}
        {section === "reading_writing" && q.passage_id && passages[q.passage_id] && (
          <div
            onMouseEnter={() => setPassageFocused(true)}
            onMouseLeave={() => setPassageFocused(false)}
            className="w-1/2 border-r border-coffee-700/15 overflow-y-auto p-8 transition-all duration-300"
          >
            <div className="text-xs text-coffee-600 uppercase tracking-wider mb-3">
              Passage
            </div>
            <Passage
              text={passages[q.passage_id]}
              highlightEnabled={highlightOn}
              userId={userId}
            />
          </div>
        )}

        {/* LEFT: embedded passage split from prompt (Bluebook style) */}
        {section === "reading_writing" && !q.passage_id && splitPrompt(q.prompt).passage && (
          <div
            onMouseEnter={() => setPassageFocused(true)}
            onMouseLeave={() => setPassageFocused(false)}
            className="w-1/2 border-r border-coffee-700/15 overflow-y-auto p-8 transition-all duration-300"
          >
            <Passage
              text={splitPrompt(q.prompt).passage!}
              highlightEnabled={highlightOn}
              userId={userId}
            />
          </div>
        )}

        {/* RIGHT: question + choices */}
        <div className={`${
          section === "reading_writing" && (q.passage_id || splitPrompt(q.prompt).passage) ? "w-1/2" : "w-full max-w-3xl mx-auto"
        } overflow-y-auto p-8 transition-opacity duration-300 ${
          passageFocused ? "opacity-60" : "opacity-100"
        }`}>
          {/* Question number bar */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <span className="bg-coffee-800 text-cream-50 font-medium text-sm px-3 py-1 rounded-lg">
                Question {current + 1} of {questions.length}
              </span>
              <button
                onClick={() => updateAnswer({ flagged: !a.flagged })}
                className={`text-sm px-2.5 py-1 rounded-lg transition ${
                  a.flagged
                    ? "bg-yellow-300 text-coffee-900"
                    : "bg-cream-200 text-coffee-600 hover:bg-beige-300"
                }`}
              >
                {a.flagged ? "🚩 Marked" : "⚐ Mark for review"}
              </button>
            </div>
            <button
              onClick={toggleBookmark}
              className={`text-sm px-2.5 py-1 rounded-lg transition ${
                a.bookmarked
                  ? "bg-coffee-700 text-cream-50"
                  : "bg-cream-200 text-coffee-600 hover:bg-beige-300"
              }`}
            >
              {a.bookmarked ? "🔖 Saved" : "🔖 Save for later"}
            </button>
          </div>

          {/* Prompt */}
          <div className="font-display text-lg text-coffee-900 leading-relaxed mb-4">
            <RichText text={
              section === "reading_writing" && !q.passage_id && splitPrompt(q.prompt).passage
                ? splitPrompt(q.prompt).question
                : q.prompt
            } />
          </div>

          {/* LaTeX block */}
          {q.prompt_latex && (
            <div className="bg-cream-100 rounded-lg p-4 mb-4 overflow-x-auto">
              <BlockMath math={q.prompt_latex} errorColor="#cc0000" />
            </div>
          )}

          {/* Image */}
          {q.prompt_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={q.prompt_image_url}
              alt="Question figure"
              className="max-w-full rounded-lg border border-coffee-700/10 mb-4"
            />
          )}

          {/* Answer area */}
          {isSPR ? (
            <div className="mb-6">
              <label>Your answer</label>
              <input
                type="text"
                value={a.selected ?? ""}
                onChange={(e) => updateAnswer({ selected: e.target.value })}
                disabled={a.submitted && practiceMode === "practice"}
                placeholder="Type your answer"
                style={{ maxWidth: "240px" }}
              />
            </div>
          ) : (
            <div className="space-y-2.5 mb-6">
              {LETTERS.map((letter) => {
                const choiceText = q[`choice_${letter.toLowerCase()}` as keyof Question] as string | null;
                if (!choiceText) return null;
                const selected = a.selected === letter;
                const struck = a.struck.includes(letter);
                const isAnswer = letter === q.correct_answer;

                let style = "border-coffee-700/15 bg-cream-50 hover:border-beige-400";
                if (showResult) {
                  if (isAnswer) style = "border-green-600 bg-green-50";
                  else if (selected) style = "border-red-500 bg-red-50";
                } else if (selected) {
                  style = "border-coffee-800 bg-cream-200";
                }

                return (
                  <div key={letter} className="flex items-center gap-2">
                    <button
                      onClick={() => selectChoice(letter)}
                      className={`flex-1 flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all duration-200 text-left ${style} ${
                        struck ? "opacity-40" : "hover:scale-[1.01] hover:shadow-sm"
                      } ${
                        selected && !showResult
                          ? "option-glow bg-gradient-to-br from-cream-200 to-cream-100"
                          : ""
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-full grid place-items-center text-sm font-semibold shrink-0 transition ${
                        selected
                          ? "bg-coffee-800 text-cream-50"
                          : "bg-cream-100 border-2 border-coffee-700 text-coffee-800"
                      }`}>
                        {letter}
                      </span>
                      <span className={`text-coffee-800 ${struck ? "line-through" : ""}`}>
                        <RichText text={choiceText} />
                      </span>
                      {showResult && isAnswer && (
                        <span className="ml-auto text-green-700 text-sm font-medium">✓ Correct</span>
                      )}
                    </button>
                    <button
                      onClick={() => toggleStrike(letter)}
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

          {/* Practice-mode submit + explanation */}
          {practiceMode === "practice" && (
            <>
              {!a.submitted && (
                <button
                  onClick={submitPractice}
                  disabled={a.selected == null}
                  className="bg-coffee-800 hover:bg-coffee-900 disabled:opacity-40 text-cream-50 px-6 py-2.5 rounded-full font-medium text-sm"
                >
                  Check answer
                </button>
              )}
              {showResult && (
                <div className={`rounded-xl p-5 border-2 ${
                  isCorrect(a, q)
                    ? "bg-green-50 border-green-300"
                    : "bg-red-50 border-red-300"
                }`}>
                  <div className={`font-display font-semibold mb-2 ${
                    isCorrect(a, q) ? "text-green-800" : "text-red-800"
                  }`}>
                    {isCorrect(a, q) ? "✓ Correct!" : "✗ Not quite"}
                    {!isCorrect(a, q) && (
                      <span className="text-coffee-700 font-normal">
                        {" "}— the answer is {isSPR ? q.spr_answer : q.correct_answer}.
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-coffee-800 leading-relaxed">
                    <RichText text={q.explanation} />
                  </div>
                  <button
                    onClick={() => setShareModal({
                      questionId: q.id,
                      prompt: q.prompt,
                      answer: a.selected ?? "",
                      correct: isCorrect(a, q),
                    })}
                    className="mt-3 flex items-center gap-1.5 text-xs text-coffee-500 hover:text-coffee-800 transition"
                  >
                    <span>📤</span> Share to chat
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ===== BOTTOM BAR ===== */}
      <footer className="border-t border-coffee-700/15 bg-cream-100 px-6 py-3 flex items-center justify-between">
        <button
          onClick={goPrev}
          disabled={current === 0}
          className="px-5 py-2 rounded-full text-sm font-medium text-coffee-700 hover:bg-cream-200 disabled:opacity-30"
        >
          ← Previous
        </button>

        <button
          onClick={() => setShowNav(!showNav)}
          className="text-sm font-medium text-coffee-700 hover:text-coffee-900 bg-cream-200 px-4 py-2 rounded-full"
        >
          {answeredCount} of {questions.length} answered · Question navigator
        </button>

        {current < questions.length - 1 ? (
          <button
            onClick={goNext}
            className="bg-coffee-800 hover:bg-coffee-900 text-cream-50 px-5 py-2 rounded-full text-sm font-medium"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={finishDrill}
            disabled={finishing}
            className="bg-green-700 hover:bg-green-800 disabled:opacity-50 text-cream-50 px-5 py-2 rounded-full text-sm font-medium"
          >
            {finishing ? "Finishing…" : "Finish drill ✓"}
          </button>
        )}
      </footer>

      {/* ===== QUESTION NAVIGATOR POPUP ===== */}
      {showNav && (
        <div
          className="fixed inset-0 bg-coffee-900/30 z-30 flex items-end justify-center pb-20"
          onClick={() => setShowNav(false)}
        >
          <div
            className="glass rounded-2xl p-6 max-w-lg w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-display font-semibold text-coffee-900 mb-4">
              Jump to question
            </div>
            <div className="grid grid-cols-8 gap-2 mb-4">
              {questions.map((_, i) => {
                const ans = answers[i];
                let cls = "bg-cream-100 text-coffee-700 border-coffee-700/15";
                if (i === current) cls = "bg-coffee-800 text-cream-50 border-coffee-800";
                else if (ans.selected != null) cls = "bg-beige-300 text-coffee-800 border-beige-400";
                return (
                  <button
                    key={i}
                    onClick={() => { setCurrent(i); setShowNav(false); }}
                    className={`relative h-10 rounded-lg border-2 text-sm font-medium ${cls}`}
                  >
                    {i + 1}
                    {answers[i].flagged && (
                      <span className="absolute -top-1 -right-1 text-xs">🚩</span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-4 text-xs text-coffee-600">
              <span>⬛ Current</span>
              <span>🟫 Answered</span>
              <span>🚩 Marked for review</span>
            </div>
          </div>
        </div>
      )}

      {/* ===== TOOL PANELS ===== */}
      {showCalc && <CalculatorPanel onClose={() => setShowCalc(false)} />}
      {showRef && <ReferencePanel onClose={() => setShowRef(false)} />}
      {shareModal && (
        <ShareQuestionModal
          questionId={shareModal.questionId}
          questionPrompt={shareModal.prompt}
          selectedAnswer={shareModal.answer}
          wasCorrect={shareModal.correct}
          onClose={() => setShareModal(null)}
        />
      )}
    </div>
    </>
  );
}

// ---- Passage with click-drag highlighting ----
function Passage({
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
    // Only single words (no spaces, only letters/hyphens) — avoid phrases
    const cleaned = sel.replace(/[^a-zA-Z\-']/g, "");
    if (!cleaned || cleaned.length < 2 || cleaned.length > 40) return;

    const word = cleaned.toLowerCase();
    const { lookupWord } = await import("@/lib/dictionary");
    const { createClient } = await import("@/lib/supabase-client");
    const supabase = createClient();

    // Try fetching a definition
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
        className={`text-coffee-800 leading-relaxed whitespace-pre-wrap select-text ${
          highlightEnabled ? "cursor-text" : ""
        }`}
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

// ---- Smart prompt splitter: separates embedded passage from question stem ----
// Bluebook-style: passage renders on the left, question stem + choices on the right.
const QUESTION_STEM_PATTERNS = [
  /^Which choice/i, /^Which finding/i, /^Which quotation/i, /^Which statement/i,
  /^Based on the text/i, /^Based on the texts/i, /^According to the text/i,
  /^As used in the text/i, /^The student wants/i, /^What does the/i,
  /^What is the main/i, /^The author makes/i, /^Which choice best/i,
];

function splitPrompt(prompt: string): { passage: string | null; question: string } {
  if (!prompt) return { passage: null, question: prompt };
  const paragraphs = prompt.split(/\n\s*\n/);
  if (paragraphs.length < 2) return { passage: null, question: prompt };

  // Find the LAST paragraph that looks like a question stem
  let stemIndex = -1;
  for (let i = paragraphs.length - 1; i >= 0; i--) {
    const p = paragraphs[i].trim();
    if (QUESTION_STEM_PATTERNS.some((re) => re.test(p))) {
      stemIndex = i;
      break;
    }
  }
  // Fallback: last paragraph ends with "?" and passage part is substantial
  if (stemIndex === -1) {
    const last = paragraphs[paragraphs.length - 1].trim();
    if (last.endsWith("?") && paragraphs.slice(0, -1).join(" ").length > 150) {
      stemIndex = paragraphs.length - 1;
    }
  }
  if (stemIndex <= 0) return { passage: null, question: prompt };

  const passage = paragraphs.slice(0, stemIndex).join("\n\n").trim();
  const question = paragraphs.slice(stemIndex).join("\n\n").trim();
  // Only split when the passage part is meaningful (avoid splitting short prompts)
  if (passage.length < 120) return { passage: null, question: prompt };
  return { passage, question };
}
