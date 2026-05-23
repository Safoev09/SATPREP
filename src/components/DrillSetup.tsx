"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { SKILLS } from "@/lib/skills";

export default function DrillSetup({
  section,
  skillCounts,
}: {
  section: "reading_writing" | "math";
  skillCounts: Record<string, number>;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [count, setCount] = useState(10);
  const [customCount, setCustomCount] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | "mixed" | "adaptive">("mixed");
  const [practiceMode, setPracticeMode] = useState<"practice" | "test">("practice");
  const [timeLimit, setTimeLimit] = useState<"untimed" | "60" | "90" | "120">("untimed");
  const [skipCorrect, setSkipCorrect] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const domains = SKILLS[section];
  const sectionLabel = section === "reading_writing" ? "Reading & Writing" : "Math";

  const availableForSkill = selectedSkill ? skillCounts[selectedSkill] ?? 0 : 0;

  const startDrill = async () => {
    if (!selectedSkill) {
      setError("Pick a skill first.");
      return;
    }
    const finalCount = customCount ? parseInt(customCount) : count;
    if (!finalCount || finalCount < 1) {
      setError("Choose how many questions.");
      return;
    }
    if (availableForSkill === 0) {
      setError("No questions available for this skill yet. Try another, or add questions in the admin panel.");
      return;
    }

    setStarting(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Not logged in.");
      setStarting(false);
      return;
    }

    // Create the session row
    const timeLimitSeconds =
      timeLimit === "untimed" ? null : parseInt(timeLimit) * Math.min(finalCount, availableForSkill);

    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .insert({
        user_id: user.id,
        mode: "drill",
        skill: selectedSkill,
        section,
        practice_mode: practiceMode,
        difficulty,
        status: "in_progress",
      })
      .select()
      .single();

    if (sessionError || !session) {
      setError("Could not start the drill: " + (sessionError?.message ?? "unknown error"));
      setStarting(false);
      return;
    }

    // Pass config via URL params so the practice page can build the question set
    const params = new URLSearchParams({
      count: String(finalCount),
      difficulty,
      skipCorrect: skipCorrect ? "1" : "0",
      timeLimit: timeLimitSeconds ? String(timeLimitSeconds) : "0",
    });

    router.push(`/app/practice/${session.id}?${params.toString()}`);
  };

  return (
    <div className="p-10 max-w-4xl">
      <h1 className="font-display text-3xl font-semibold text-coffee-900 mb-1">
        {sectionLabel} drills
      </h1>
      <p className="text-coffee-600 mb-8">
        Pick a skill, set it up, and practise. Questions ramp from easy to hard.
      </p>

      {/* Skill picker */}
      <div className="mb-8">
        <h2 className="font-display font-semibold text-lg text-coffee-900 mb-3">
          1. Choose a skill
        </h2>
        <div className="space-y-5">
          {Object.entries(domains).map(([domain, skills]) => (
            <div key={domain}>
              <div className="text-xs text-coffee-600 uppercase tracking-wider mb-2 font-medium">
                {domain}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(skills as readonly { id: string; label: string }[]).map((skill) => {
                  const n = skillCounts[skill.id] ?? 0;
                  const selected = selectedSkill === skill.id;
                  return (
                    <button
                      key={skill.id}
                      onClick={() => setSelectedSkill(skill.id)}
                      className={`text-left px-4 py-3 rounded-xl border-2 transition ${
                        selected
                          ? "border-coffee-800 bg-cream-200"
                          : "border-coffee-700/10 bg-cream-50 hover:border-beige-400"
                      }`}
                    >
                      <div className="font-medium text-coffee-900 text-sm">
                        {skill.label}
                      </div>
                      <div className={`text-xs mt-0.5 ${n > 0 ? "text-coffee-600" : "text-red-600"}`}>
                        {n} question{n === 1 ? "" : "s"} available
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Config — only show once a skill is picked */}
      {selectedSkill && (
        <div className="space-y-7 mb-8">
          <h2 className="font-display font-semibold text-lg text-coffee-900">
            2. Set it up
          </h2>

          {/* Count */}
          <div>
            <label>How many questions?</label>
            <div className="flex gap-2 flex-wrap items-center">
              {[5, 10, 20, 50].map((n) => (
                <button
                  key={n}
                  onClick={() => { setCount(n); setCustomCount(""); }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    count === n && !customCount
                      ? "bg-coffee-800 text-cream-50"
                      : "bg-cream-100 text-coffee-700 hover:bg-cream-200"
                  }`}
                >
                  {n}
                </button>
              ))}
              <input
                type="number"
                min={1}
                placeholder="custom"
                value={customCount}
                onChange={(e) => setCustomCount(e.target.value)}
                style={{ width: "100px" }}
              />
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label>Difficulty</label>
            <div className="flex gap-2 flex-wrap">
              {([
                ["easy", "Easy"],
                ["medium", "Medium"],
                ["hard", "Hard"],
                ["mixed", "Mixed"],
                ["adaptive", "Adaptive"],
              ] as const).map(([val, lbl]) => (
                <button
                  key={val}
                  onClick={() => setDifficulty(val)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    difficulty === val
                      ? "bg-coffee-800 text-cream-50"
                      : "bg-cream-100 text-coffee-700 hover:bg-cream-200"
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Mode */}
          <div>
            <label>Mode</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPracticeMode("practice")}
                className={`text-left p-4 rounded-xl border-2 transition ${
                  practiceMode === "practice"
                    ? "border-coffee-800 bg-cream-200"
                    : "border-coffee-700/10 bg-cream-50 hover:border-beige-400"
                }`}
              >
                <div className="font-medium text-coffee-900 text-sm">Practice mode</div>
                <div className="text-xs text-coffee-600 mt-0.5">
                  See if you're right after each question, with the explanation.
                </div>
              </button>
              <button
                onClick={() => setPracticeMode("test")}
                className={`text-left p-4 rounded-xl border-2 transition ${
                  practiceMode === "test"
                    ? "border-coffee-800 bg-cream-200"
                    : "border-coffee-700/10 bg-cream-50 hover:border-beige-400"
                }`}
              >
                <div className="font-medium text-coffee-900 text-sm">Test mode</div>
                <div className="text-xs text-coffee-600 mt-0.5">
                  No feedback until the end — just like the real SAT.
                </div>
              </button>
            </div>
          </div>

          {/* Time limit */}
          <div>
            <label>Time limit</label>
            <div className="flex gap-2 flex-wrap">
              {([
                ["untimed", "Untimed"],
                ["60", "60s / question"],
                ["90", "90s / question"],
                ["120", "120s / question"],
              ] as const).map(([val, lbl]) => (
                <button
                  key={val}
                  onClick={() => setTimeLimit(val)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    timeLimit === val
                      ? "bg-coffee-800 text-cream-50"
                      : "bg-cream-100 text-coffee-700 hover:bg-cream-200"
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Skip correct */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={skipCorrect}
              onChange={(e) => setSkipCorrect(e.target.checked)}
              style={{ width: "auto" }}
              className="w-5 h-5"
            />
            <span className="text-sm text-coffee-800">
              Skip questions I've already answered correctly
            </span>
          </label>
        </div>
      )}

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      {/* Start */}
      {selectedSkill && (
        <button
          onClick={startDrill}
          disabled={starting}
          className="bg-coffee-800 hover:bg-coffee-900 disabled:opacity-50 text-cream-50 px-8 py-3.5 rounded-full font-medium transition"
        >
          {starting ? "Starting…" : "Start drill →"}
        </button>
      )}
    </div>
  );
}
