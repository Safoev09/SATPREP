"use client";

import { useState, useRef, useEffect } from "react";

type StudentContext = {
  firstName: string;
  targetScore: number | null;
  previousScore: number | null;
  xp: number;
  streak: number;
  examDate: string | null;
  weakestSkills: { label: string; pct: number; section: string }[];
  strongestSkills: { label: string; pct: number }[];
  totalAnswered: number;
  totalCorrect: number;
  recentSessions: {
    mode: string;
    skill: string | null;
    section: string;
    score: number | null;
    correct: number | null;
    total: number | null;
  }[];
};

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTED_PROMPTS = [
  "Build me a personalised study plan for this week",
  "What should I focus on to reach my target score?",
  "I'm struggling with Math — where do I start?",
  "How many hours should I study per day?",
  "My exam is soon. What's the most important thing to do?",
];

function buildSystemPrompt(ctx: StudentContext): string {
  const accuracy =
    ctx.totalAnswered > 0
      ? Math.round((ctx.totalCorrect / ctx.totalAnswered) * 100)
      : null;

  const daysLeft = ctx.examDate
    ? Math.ceil(
        (new Date(ctx.examDate).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return `You are SATPeaK's personal AI study tutor. You are warm, encouraging, and direct. You give real, actionable advice — not vague motivational fluff. You are an expert in the digital SAT.

STUDENT PROFILE:
- Name: ${ctx.firstName}
- Previous SAT score: ${ctx.previousScore ?? "Not taken yet"}
- Target score: ${ctx.targetScore ?? "Not set"}
- XP: ${ctx.xp} | Streak: ${ctx.streak} days
- Exam date: ${ctx.examDate ?? "Not set"}${daysLeft !== null ? ` (${daysLeft} days away)` : ""}
- Total questions answered: ${ctx.totalAnswered}
- Overall accuracy: ${accuracy !== null ? `${accuracy}%` : "No data yet"}

WEAKEST SKILLS (by accuracy):
${ctx.weakestSkills.length > 0 ? ctx.weakestSkills.map((s) => `- ${s.label} (${s.pct}% accuracy, ${s.section === "reading_writing" ? "R&W" : "Math"})`).join("\n") : "- No skill data yet"}

STRONGEST SKILLS:
${ctx.strongestSkills.length > 0 ? ctx.strongestSkills.map((s) => `- ${s.label} (${s.pct}% accuracy)`).join("\n") : "- No skill data yet"}

RECENT PRACTICE SESSIONS:
${ctx.recentSessions.length > 0 ? ctx.recentSessions.map((s) => `- ${s.mode}${s.skill ? ` (${s.skill})` : ""}: ${s.correct ?? "?"}/${s.total ?? "?"} correct${s.score ? `, score ${s.score}` : ""}`).join("\n") : "- None yet"}

GUIDELINES:
- When making a study plan, be specific: days of the week, which skills to drill, how long, what mode to use (drills, modules, full mock).
- Always reference the student's actual weak skills by name.
- If the exam is close (< 14 days), focus on high-impact skills and mock exams, not new content.
- If no exam date is set, gently remind them to set one in Settings.
- Keep responses concise — use short paragraphs. Use markdown lists where helpful.
- Avoid overwhelming the student. One clear priority at a time when possible.
- Tone: like a knowledgeable older student who aced the SAT, not a formal coach.`;
}

export default function AITutorChat({
  studentContext,
}: {
  studentContext: StudentContext;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: buildSystemPrompt(studentContext),
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const reply =
        data.content?.find((b: { type: string }) => b.type === "text")?.text ?? "I couldn't generate a response. Please try again.";

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="px-8 py-5 border-b border-coffee-700/10 bg-cream-50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-coffee-800 grid place-items-center">
            <span className="text-xl">🤖</span>
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold text-coffee-900 leading-tight">
              AI Study Tutor
            </h1>
            <p className="text-xs text-coffee-500">
              Personalised plans &amp; SAT guidance · powered by Claude
            </p>
          </div>
          {studentContext.streak > 0 && (
            <div className="ml-auto flex items-center gap-1.5 bg-cream-100 border border-coffee-700/10 rounded-full px-3 py-1.5 text-xs text-coffee-700 font-medium">
              🔥 {studentContext.streak}-day streak
            </div>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
        {isEmpty && (
          <div className="max-w-xl mx-auto text-center">
            <div className="text-5xl mb-4">👋</div>
            <h2 className="font-display text-2xl font-semibold text-coffee-900 mb-2">
              Hey {studentContext.firstName}!
            </h2>
            <p className="text-coffee-600 mb-8">
              I know your scores, your weak spots, and how much time you have. Ask me anything — I'll give you a real answer.
            </p>
            <div className="grid grid-cols-1 gap-2 text-left">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="text-left px-4 py-3 rounded-xl border border-coffee-700/15 bg-cream-50 hover:bg-cream-100 text-sm text-coffee-800 transition hover:border-accent/40 group"
                >
                  <span className="text-accent mr-2 group-hover:mr-3 transition-all">→</span>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-xl bg-coffee-800 grid place-items-center shrink-0 mr-3 mt-0.5">
                <span className="text-sm">🤖</span>
              </div>
            )}
            <div
              className={`max-w-xl rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-coffee-800 text-cream-50 rounded-tr-sm"
                  : "bg-cream-50 border border-coffee-700/10 text-coffee-900 rounded-tl-sm"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-xl bg-coffee-800 grid place-items-center shrink-0 mr-3 mt-0.5">
              <span className="text-sm">🤖</span>
            </div>
            <div className="bg-cream-50 border border-coffee-700/10 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-coffee-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3 max-w-xl">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="shrink-0 px-8 py-4 border-t border-coffee-700/10 bg-cream-50">
        {!isEmpty && (
          <div className="flex flex-wrap gap-2 mb-3">
            {["Build me a study plan", "What's my weakest area?", "Tips for my exam date"].map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                disabled={loading}
                className="text-xs px-3 py-1.5 rounded-full border border-coffee-700/15 bg-cream-100 text-coffee-700 hover:bg-cream-200 transition disabled:opacity-40"
              >
                {p}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-3 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your SAT prep…"
            rows={1}
            className="flex-1 resize-none bg-cream-100 border border-coffee-700/15 rounded-2xl px-4 py-3 text-sm text-coffee-900 placeholder:text-coffee-400 focus:outline-none focus:border-coffee-500 focus:ring-2 focus:ring-coffee-500/15 min-h-[46px] max-h-32"
            style={{ minHeight: 46 }}
            disabled={loading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="bg-coffee-800 hover:bg-coffee-900 disabled:opacity-40 text-cream-50 w-11 h-11 rounded-xl grid place-items-center transition shrink-0"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22l-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-coffee-400 mt-2 text-center">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
