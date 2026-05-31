"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { getSkillLabel } from "@/lib/skills";
import { FULL_TEST_SLOTS, MODULE_TEST_SLOTS, type Test } from "@/lib/tests";
import type { Question } from "@/lib/skills";

type PickedQuestion = { question_id: number; slot: string; position: number };

export default function TestBuilder({
  existing,
  existingPicks,
  allQuestions,
}: {
  existing?: Test | null;
  existingPicks?: PickedQuestion[];
  allQuestions: Question[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [testType, setTestType] = useState<"module" | "full">(existing?.test_type ?? "module");
  const [section, setSection] = useState<"reading_writing" | "math">(
    existing?.section ?? "reading_writing"
  );
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | "mixed">(
    existing?.difficulty ?? "mixed"
  );
  const [visibility, setVisibility] = useState<"free" | "premium">(
    existing?.visibility ?? "premium"
  );
  const [isPublished, setIsPublished] = useState(existing?.is_published ?? false);
  // Adaptive cutoffs (% on M1 above which student goes to hard M2)
  const [rwHardCutoff, setRwHardCutoff] = useState<number>(existing?.rw_hard_cutoff ?? 70);
  const [mathHardCutoff, setMathHardCutoff] = useState<number>(existing?.math_hard_cutoff ?? 70);

  // picks: slot -> ordered list of question ids
  const initialPicks: Record<string, number[]> = {};
  (existingPicks ?? []).forEach((p) => {
    if (!initialPicks[p.slot]) initialPicks[p.slot] = [];
    initialPicks[p.slot].push(p.question_id);
  });
  const [picks, setPicks] = useState<Record<string, number[]>>(initialPicks);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSlot, setActiveSlot] = useState<string>(
    existing?.test_type === "full" ? "rw_m1" : "module_m1"
  );
  const [search, setSearch] = useState("");

  // Slots depend on test type
  const slots =
    testType === "full"
      ? FULL_TEST_SLOTS.map((s) => ({ id: s.id, label: s.label, section: s.section }))
      : MODULE_TEST_SLOTS.map((s) => ({ id: s.id, label: s.label, section }));

  // Which section the active slot expects
  const activeSlotSection =
    testType === "full"
      ? FULL_TEST_SLOTS.find((s) => s.id === activeSlot)?.section ?? "reading_writing"
      : section;

  // Questions available to pick for the active slot
  const pickedInSlot = picks[activeSlot] ?? [];
  const candidateQuestions = allQuestions
    .filter((q) => q.section === activeSlotSection)
    .filter((q) => !pickedInSlot.includes(q.id))
    .filter((q) =>
      search
        ? q.prompt.toLowerCase().includes(search.toLowerCase()) ||
          getSkillLabel(q.skill).toLowerCase().includes(search.toLowerCase())
        : true
    );

  const addQuestion = (qid: number) => {
    setPicks((prev) => ({
      ...prev,
      [activeSlot]: [...(prev[activeSlot] ?? []), qid],
    }));
  };

  const removeQuestion = (qid: number) => {
    setPicks((prev) => ({
      ...prev,
      [activeSlot]: (prev[activeSlot] ?? []).filter((id) => id !== qid),
    }));
  };

  const moveQuestion = (qid: number, dir: -1 | 1) => {
    setPicks((prev) => {
      const list = [...(prev[activeSlot] ?? [])];
      const idx = list.indexOf(qid);
      const swap = idx + dir;
      if (swap < 0 || swap >= list.length) return prev;
      [list[idx], list[swap]] = [list[swap], list[idx]];
      return { ...prev, [activeSlot]: list };
    });
  };

  const questionById = (id: number) => allQuestions.find((q) => q.id === id);

  const totalPicked = Object.values(picks).reduce((sum, arr) => sum + arr.length, 0);

  const save = async () => {
    if (!title.trim()) {
      setError("Give the test a title.");
      return;
    }
    if (totalPicked === 0) {
      setError("Add at least one question.");
      return;
    }
    setSaving(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Not logged in.");
      setSaving(false);
      return;
    }

    const testPayload = {
      title,
      description: description || null,
      test_type: testType,
      section: testType === "module" ? section : null,
      difficulty,
      visibility,
      is_published: isPublished,
      rw_hard_cutoff: rwHardCutoff,
      math_hard_cutoff: mathHardCutoff,
      created_by: user.id,
    };

    let testId = existing?.id;

    if (existing) {
      const { error: updateError } = await supabase
        .from("tests")
        .update(testPayload)
        .eq("id", existing.id);
      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
      // Clear old test_questions, re-insert
      await supabase.from("test_questions").delete().eq("test_id", existing.id);
    } else {
      const { data: newTest, error: insertError } = await supabase
        .from("tests")
        .insert(testPayload)
        .select()
        .single();
      if (insertError || !newTest) {
        setError(insertError?.message ?? "Could not create test.");
        setSaving(false);
        return;
      }
      testId = newTest.id;
    }

    // Build test_questions rows
    const rows: { test_id: number; question_id: number; slot: string; position: number }[] = [];
    Object.entries(picks).forEach(([slot, ids]) => {
      ids.forEach((qid, i) => {
        rows.push({ test_id: testId!, question_id: qid, slot, position: i });
      });
    });

    if (rows.length > 0) {
      const { error: tqError } = await supabase.from("test_questions").insert(rows);
      if (tqError) {
        setError("Saved test, but failed to save questions: " + tqError.message);
        setSaving(false);
        return;
      }
    }

    router.push("/admin/tests");
    router.refresh();
  };

  const handleDelete = async () => {
    if (!existing) return;
    if (!confirm("Delete this test permanently?")) return;
    setSaving(true);
    await supabase.from("tests").delete().eq("id", existing.id);
    router.push("/admin/tests");
    router.refresh();
  };

  return (
    <div className="p-10 max-w-5xl">
      <h1 className="font-display text-3xl font-semibold text-coffee-900 mb-6">
        {existing ? `Edit test: ${existing.title}` : "Create a test"}
      </h1>

      {/* Test details */}
      <div className="bg-cream-50 border border-coffee-700/10 rounded-2xl p-6 mb-6 space-y-4">
        <h2 className="font-display font-semibold text-lg text-coffee-900">Test details</h2>

        <div>
          <label>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Practice Test 1 — Math Module (Medium)"
          />
        </div>

        <div>
          <label>Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="A short note shown to students"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label>Test type</label>
            <select value={testType} onChange={(e) => {
              const t = e.target.value as "module" | "full";
              setTestType(t);
              setActiveSlot(t === "full" ? "rw_m1" : "module_m1");
            }}>
              <option value="module">Single module</option>
              <option value="full">Full SAT (4 modules)</option>
            </select>
          </div>
          {testType === "module" && (
            <div>
              <label>Section</label>
              <select value={section} onChange={(e) => setSection(e.target.value as "reading_writing" | "math")}>
                <option value="reading_writing">Reading & Writing</option>
                <option value="math">Math</option>
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label>Difficulty label</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
          <div>
            <label>Who can access this test?</label>
            <select value={visibility} onChange={(e) => setVisibility(e.target.value as "free" | "premium")}>
              <option value="free">Free — everyone</option>
              <option value="premium">Premium — paid users only</option>
            </select>
          </div>
        </div>

        {/* Adaptive cutoffs */}
        <div className="bg-cream-100 border border-coffee-700/10 rounded-2xl p-5">
          <div className="text-sm font-medium text-coffee-900 mb-1">
            Adaptive routing — Module 2 difficulty
          </div>
          <p className="text-xs text-coffee-600 mb-4 leading-relaxed">
            On the real Digital SAT, Module 2 difficulty depends on Module 1 performance. Set the cutoff: a student who gets at least this % correct on Module 1 will get the HARD Module 2; below it, the EASY Module 2.
          </p>
          <div className={`grid ${testType === "full" ? "grid-cols-2" : "grid-cols-1"} gap-4`}>
            {(testType === "full" || section === "reading_writing") && (
              <div>
                <label>R&W hard-M2 cutoff (% correct on R&W M1)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={rwHardCutoff}
                  onChange={(e) => setRwHardCutoff(Math.max(0, Math.min(100, Number(e.target.value))))}
                />
              </div>
            )}
            {(testType === "full" || section === "math") && (
              <div>
                <label>Math hard-M2 cutoff (% correct on Math M1)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={mathHardCutoff}
                  onChange={(e) => setMathHardCutoff(Math.max(0, Math.min(100, Number(e.target.value))))}
                />
              </div>
            )}
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            style={{ width: "auto" }}
            className="w-5 h-5"
          />
          <span className="text-sm text-coffee-800">
            <strong>Publish</strong> — show this test to students
          </span>
        </label>
      </div>

      {/* Question picker */}
      <div className="bg-cream-50 border border-coffee-700/10 rounded-2xl p-6 mb-6">
        <h2 className="font-display font-semibold text-lg text-coffee-900 mb-3">
          Pick questions ({totalPicked} added)
        </h2>

        {/* Slot tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {slots.map((slot) => (
            <button
              key={slot.id}
              onClick={() => setActiveSlot(slot.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                activeSlot === slot.id
                  ? "bg-coffee-800 text-cream-50"
                  : "bg-cream-100 text-coffee-700 hover:bg-cream-200"
              }`}
            >
              {slot.label} ({(picks[slot.id] ?? []).length})
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* LEFT: picked questions in this slot */}
          <div>
            <div className="text-xs text-coffee-600 uppercase tracking-wider mb-2 font-medium">
              In this slot — in order
            </div>
            {pickedInSlot.length === 0 ? (
              <div className="text-sm text-coffee-600 bg-cream-100 rounded-lg p-4">
                No questions yet. Add some from the right →
              </div>
            ) : (
              <div className="space-y-1.5">
                {pickedInSlot.map((qid, i) => {
                  const q = questionById(qid);
                  if (!q) return null;
                  return (
                    <div key={qid} className="bg-cream-100 rounded-lg p-2.5 flex items-center gap-2">
                      <span className="text-xs text-coffee-600 w-5">{i + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-coffee-900 truncate">{q.prompt}</div>
                        <div className="text-xs text-coffee-600">
                          {getSkillLabel(q.skill)} · {q.difficulty}
                        </div>
                      </div>
                      <button onClick={() => moveQuestion(qid, -1)} className="text-coffee-600 hover:text-coffee-900 text-xs px-1" title="Move up">▲</button>
                      <button onClick={() => moveQuestion(qid, 1)} className="text-coffee-600 hover:text-coffee-900 text-xs px-1" title="Move down">▼</button>
                      <button onClick={() => removeQuestion(qid)} className="text-red-600 hover:text-red-800 text-xs px-1" title="Remove">✕</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: available questions to add */}
          <div>
            <div className="text-xs text-coffee-600 uppercase tracking-wider mb-2 font-medium">
              Available {activeSlotSection === "math" ? "Math" : "R&W"} questions
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by prompt or skill…"
              className="mb-2"
            />
            <div className="space-y-1.5 max-h-96 overflow-y-auto">
              {candidateQuestions.length === 0 ? (
                <div className="text-sm text-coffee-600 bg-cream-100 rounded-lg p-4">
                  No matching questions. Add more in the Question Bank, or clear the search.
                </div>
              ) : (
                candidateQuestions.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => addQuestion(q.id)}
                    className="w-full text-left bg-cream-100 hover:bg-cream-200 rounded-lg p-2.5 transition flex items-center gap-2"
                  >
                    <span className="text-coffee-700 text-lg leading-none">+</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-coffee-900 truncate">{q.prompt}</div>
                      <div className="text-xs text-coffee-600">
                        {getSkillLabel(q.skill)} · {q.difficulty} · {q.visibility === "premium" ? "⭐ premium" : "🆓 free"}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          {existing && (
            <button onClick={handleDelete} className="text-red-700 hover:text-red-900 text-sm">
              Delete test
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/admin/tests")}
            className="px-5 py-2.5 rounded-full text-sm font-medium text-coffee-700 hover:bg-cream-100"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="bg-coffee-800 hover:bg-coffee-900 disabled:opacity-50 text-cream-50 px-6 py-2.5 rounded-full text-sm font-medium"
          >
            {saving ? "Saving…" : existing ? "Save changes" : "Create test"}
          </button>
        </div>
      </div>
    </div>
  );
}
