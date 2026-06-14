"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import type { Question } from "@/lib/skills";

const RW_SKILLS = [
  { id: "words_in_context", label: "Words in Context" },
  { id: "text_structure", label: "Text Structure & Purpose" },
  { id: "central_ideas", label: "Central Ideas & Details" },
  { id: "inferences", label: "Inferences" },
  { id: "command_of_evidence", label: "Command of Evidence" },
  { id: "cross_text", label: "Cross-Text Connections" },
  { id: "transitions", label: "Transitions" },
  { id: "rhetorical_synthesis", label: "Rhetorical Synthesis" },
  { id: "boundaries", label: "Boundaries" },
  { id: "form_structure_sense", label: "Form, Structure, and Sense" },
];

const MATH_SKILLS = [
  { id: "algebra", label: "Algebra" },
  { id: "advanced_math", label: "Advanced Math" },
  { id: "problem_solving_data", label: "Problem-Solving & Data Analysis" },
  { id: "geometry_trig", label: "Geometry & Trigonometry" },
];

type Props = {
  open: boolean;
  section: "reading_writing" | "math";
  slotLabel: string;                  // human-readable slot name, e.g. "R&W Module 1"
  visibility: "free" | "premium";     // matches the test's visibility
  onClose: () => void;
  // Called after each successful save with the newly created question
  // (so TestBuilder can add the id to picks + the row to its local extras list)
  onQuestionCreated: (q: Question) => void;
};

type FormState = {
  prompt: string;
  prompt_image_url?: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  correct: "A" | "B" | "C" | "D";
  explanation: string;
  skill: string;
  difficulty: "easy" | "medium" | "hard";
  saveToBank: boolean;
};

const emptyForm = (section: "reading_writing" | "math"): FormState => ({
  prompt: "",
  prompt_image_url: "",
  choice_a: "",
  choice_b: "",
  choice_c: "",
  choice_d: "",
  correct: "A",
  explanation: "",
  skill: section === "math" ? MATH_SKILLS[0].id : RW_SKILLS[0].id,
  difficulty: "medium",
  saveToBank: true,
});

export default function InlineQuestionCreator({
  open,
  section,
  slotLabel,
  visibility,
  onClose,
  onQuestionCreated,
}: Props) {
  const [form, setForm] = useState<FormState>(emptyForm(section));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedThisSession, setAddedThisSession] = useState(0);

  if (!open) return null;

  const skills = section === "math" ? MATH_SKILLS : RW_SKILLS;

  const validate = (): string | null => {
    if (!form.prompt.trim()) return "Prompt cannot be empty.";
    if (!form.choice_a.trim() || !form.choice_b.trim() || !form.choice_c.trim() || !form.choice_d.trim())
      return "All four choices (A–D) must be filled in.";
    if (!form.explanation.trim()) return "Explanation cannot be empty.";
    return null;
  };

  const save = async (closeAfter: boolean) => {
    setError(null);
    const v = validate();
    if (v) { setError(v); return; }

    setSaving(true);
    const supabase = createClient();

    try {
      const sourceTest = form.saveToBank
        ? "admin_inline_added"
        : `test_exclusive_${Date.now()}`;

      const { data: insertedQ, error: qErr } = await supabase
        .from("questions")
        .insert({
          source_test: sourceTest,
          source_module: section === "math" ? "math" : "rw",
          source_question_number: null,
          section,
          skill: form.skill,
          difficulty: form.difficulty,
          prompt: form.prompt.trim(),
          prompt_image_url: form.prompt_image_url?.trim() || null,
          choice_a: form.choice_a.trim(),
          choice_b: form.choice_b.trim(),
          choice_c: form.choice_c.trim(),
          choice_d: form.choice_d.trim(),
          correct_answer: form.correct,
          explanation: form.explanation.trim(),
          is_published: form.saveToBank,
          visibility,
        })
        .select("*")
        .single();

      if (qErr) throw qErr;

      // Hand the new question back to TestBuilder
      onQuestionCreated(insertedQ as Question);
      setAddedThisSession((n) => n + 1);

      if (closeAfter) {
        setForm(emptyForm(section));
        onClose();
      } else {
        // reset for next entry; remember last skill/difficulty/checkbox
        setForm({
          ...emptyForm(section),
          skill: form.skill,
          difficulty: form.difficulty,
          saveToBank: form.saveToBank,
        });
      }
    } catch (e: any) {
      setError(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-coffee-900/50 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-8 px-4">
      <div className="bg-cream-50 rounded-3xl max-w-4xl w-full p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-display text-2xl font-semibold text-coffee-900">
              Add question to {slotLabel}
            </h2>
            <p className="text-sm text-coffee-600 mt-1">
              Type the question below. Use <kbd className="bg-cream-200 px-1.5 py-0.5 rounded text-xs font-mono">Save & Add Next</kbd> to keep going, or <kbd className="bg-cream-200 px-1.5 py-0.5 rounded text-xs font-mono">Save & Close</kbd> when done.
              {addedThisSession > 0 && (
                <span className="ml-2 inline-block bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">
                  {addedThisSession} added so far
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-coffee-500 hover:text-coffee-900 text-2xl leading-none px-2"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3 text-sm mb-3">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-coffee-700 uppercase tracking-wide">Skill</span>
              <select
                value={form.skill}
                onChange={(e) => setForm({ ...form, skill: e.target.value })}
                className="mt-1 w-full bg-cream-100 border border-coffee-700/15 rounded-xl px-3 py-2 text-sm"
              >
                {skills.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-coffee-700 uppercase tracking-wide">Difficulty</span>
              <select
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value as any })}
                className="mt-1 w-full bg-cream-100 border border-coffee-700/15 rounded-xl px-3 py-2 text-sm capitalize"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </label>
            <div className="flex items-end">
              <div className="text-xs text-coffee-600 italic">
                Visibility: <span className="font-medium text-coffee-800 capitalize">{visibility}</span> (inherits from test)
              </div>
            </div>
          </div>

          <label className="block">
            <span className="text-xs font-medium text-coffee-700 uppercase tracking-wide">Passage + Question prompt</span>
            <textarea
              value={form.prompt}
              onChange={(e) => setForm({ ...form, prompt: e.target.value })}
              rows={8}
              placeholder={"Paste the full passage here, then on a new line write the question.\n\nExample:\nThe Aral Sea, once the fourth-largest lake in the world, has shrunk to a fraction of its original size...\n\nWhich choice best states the main idea of the text?"}
              className="mt-1 w-full bg-cream-100 border border-coffee-700/15 rounded-xl px-3 py-2 text-sm font-mono leading-relaxed"
            />
          </label>

          {/* LaTeX helper — only shown for Math section */}
          {section === "math" && (
            <LatexHelper
              prompt={form.prompt}
              onInsert={(latex) => setForm({ ...form, prompt: form.prompt + latex })}
            />
          )}

          {/* Image upload for Math / charts */}
          <ImageUpload
            currentUrl={form.prompt_image_url ?? ""}
            onUploaded={(url) => setForm({ ...form, prompt_image_url: url })}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(["A", "B", "C", "D"] as const).map((letter) => {
              const fieldName = `choice_${letter.toLowerCase()}` as "choice_a" | "choice_b" | "choice_c" | "choice_d";
              const isCorrect = form.correct === letter;
              return (
                <label key={letter} className={`block rounded-xl border-2 transition p-3 ${isCorrect ? "border-green-500 bg-green-50" : "border-coffee-700/15 bg-cream-100"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-coffee-700 uppercase tracking-wide">
                      Choice ({letter})
                    </span>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                      <input
                        type="radio"
                        name="correct"
                        checked={isCorrect}
                        onChange={() => setForm({ ...form, correct: letter })}
                        className="accent-green-600"
                      />
                      <span className={isCorrect ? "text-green-700 font-semibold" : "text-coffee-600"}>
                        {isCorrect ? "✓ Correct" : "Mark correct"}
                      </span>
                    </label>
                  </div>
                  <textarea
                    value={form[fieldName]}
                    onChange={(e) => setForm({ ...form, [fieldName]: e.target.value } as FormState)}
                    rows={2}
                    placeholder={`Answer text for choice ${letter}`}
                    className="w-full bg-cream-50 border border-coffee-700/10 rounded-lg px-2 py-1.5 text-sm"
                  />
                </label>
              );
            })}
          </div>

          <label className="block">
            <span className="text-xs font-medium text-coffee-700 uppercase tracking-wide">
              Explanation (why right is right, why wrong are wrong)
            </span>
            <textarea
              value={form.explanation}
              onChange={(e) => setForm({ ...form, explanation: e.target.value })}
              rows={4}
              placeholder="Explain why the correct answer is right and briefly why each other choice is wrong."
              className="mt-1 w-full bg-cream-100 border border-coffee-700/15 rounded-xl px-3 py-2 text-sm leading-relaxed"
            />
          </label>

          <label className="flex items-start gap-3 bg-cream-100 rounded-xl p-3 border border-coffee-700/10 cursor-pointer">
            <input
              type="checkbox"
              checked={form.saveToBank}
              onChange={(e) => setForm({ ...form, saveToBank: e.target.checked })}
              className="mt-0.5 accent-coffee-800 scale-110"
            />
            <div className="text-sm">
              <div className="font-medium text-coffee-900">Also save to the question bank</div>
              <div className="text-xs text-coffee-600 mt-0.5">
                When checked, this question appears in the main question bank and can be reused in drills and other tests. When unchecked, the question is exclusive to this test only.
              </div>
            </div>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t border-coffee-700/10">
          <button
            type="button"
            onClick={() => save(false)}
            disabled={saving}
            className="bg-coffee-800 hover:bg-coffee-900 text-cream-50 font-medium text-sm px-5 py-2.5 rounded-full disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save & Add Next →"}
          </button>
          <button
            type="button"
            onClick={() => save(true)}
            disabled={saving}
            className="bg-cream-100 hover:bg-cream-200 text-coffee-800 font-medium text-sm px-5 py-2.5 rounded-full border border-coffee-700/15 disabled:opacity-50"
          >
            Save & Close
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-coffee-600 hover:text-coffee-900 text-sm px-3 py-2.5 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Reusable image uploader for question images ----
function ImageUpload({ currentUrl, onUploaded }: { currentUrl: string; onUploaded: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("File too large (max 5 MB)."); return; }
    setUploading(true);
    setError(null);
    const fileName = `question-${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const { data, error: uploadError } = await supabase.storage
      .from("question-images")
      .upload(fileName, file, { upsert: true });
    if (uploadError) { setError(uploadError.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("question-images").getPublicUrl(data.path);
    onUploaded(urlData.publicUrl);
    setUploading(false);
  };

  return (
    <div className="space-y-2">
      <span className="text-xs font-medium text-coffee-700 uppercase tracking-wide">Image / diagram (optional)</span>
      <div className="flex items-center gap-3">
        <label className="cursor-pointer bg-cream-100 hover:bg-cream-200 border border-coffee-700/15 rounded-xl px-4 py-2 text-sm text-coffee-700 transition">
          {uploading ? "Uploading…" : "📎 Upload image"}
          <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </label>
        {currentUrl && (
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={currentUrl} alt="preview" className="h-10 w-16 object-cover rounded-lg border border-coffee-700/15" />
            <button onClick={() => onUploaded("")} className="text-xs text-red-600 hover:text-red-800">Remove</button>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

// ---- LaTeX Helper for Math questions ----
function LatexHelper({ prompt, onInsert }: { prompt: string; onInsert: (latex: string) => void }) {
  const [showPreview, setShowPreview] = useState(false);

  const snippets = [
    { label: "Fraction", latex: "\\frac{a}{b}", display: "a/b" },
    { label: "Square root", latex: "\\sqrt{x}", display: "√x" },
    { label: "Power", latex: "x^{2}", display: "x²" },
    { label: "Subscript", latex: "x_{1}", display: "x₁" },
    { label: "Multiply ×", latex: "\\times", display: "×" },
    { label: "Divide ÷", latex: "\\div", display: "÷" },
    { label: "Not equal ≠", latex: "\\neq", display: "≠" },
    { label: "Less/equal ≤", latex: "\\leq", display: "≤" },
    { label: "Greater/equal ≥", latex: "\\geq", display: "≥" },
    { label: "π", latex: "\\pi", display: "π" },
    { label: "Infinity ∞", latex: "\\infty", display: "∞" },
    { label: "Quadratic", latex: "ax^{2}+bx+c=0", display: "ax²+bx+c=0" },
    { label: "Linear", latex: "y=mx+b", display: "y=mx+b" },
    { label: "Absolute value", latex: "|x|", display: "|x|" },
  ];

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-blue-800 uppercase tracking-wide">
          📐 Math / LaTeX helper
        </div>
        <button
          type="button"
          onClick={() => setShowPreview(v => !v)}
          className="text-xs text-blue-600 hover:text-blue-800 underline"
        >
          {showPreview ? "Hide preview" : "Show preview"}
        </button>
      </div>

      <p className="text-xs text-blue-700">
        Wrap math in <code className="bg-blue-100 px-1 rounded">$...$</code> for inline.
        Example: <code className="bg-blue-100 px-1 rounded">The value of $x^2 + 3x$ when $x=2$ is</code>
      </p>

      <div className="flex flex-wrap gap-1.5">
        {snippets.map(s => (
          <button
            key={s.label}
            type="button"
            onClick={() => onInsert(` $${s.latex}$ `)}
            title={`Insert: $${s.latex}$`}
            className="bg-white border border-blue-200 text-blue-800 text-xs px-2.5 py-1 rounded-lg hover:bg-blue-100 transition"
          >
            {s.display}
          </button>
        ))}
      </div>

      {showPreview && prompt && (
        <div className="bg-white border border-blue-200 rounded-lg p-3">
          <div className="text-[10px] text-blue-600 uppercase tracking-wide mb-2">Preview</div>
          <RichTextPreview text={prompt} />
        </div>
      )}
    </div>
  );
}

function RichTextPreview({ text }: { text: string }) {
  // Split by $...$ inline math
  const parts = text.split(/(\$[^$]+\$)/g);
  return (
    <div className="text-sm text-coffee-900 leading-relaxed whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (part.startsWith("$") && part.endsWith("$")) {
          const math = part.slice(1, -1);
          try {
            const { InlineMath } = require("react-katex");
            return <InlineMath key={i} math={math} />;
          } catch {
            return <code key={i} className="bg-yellow-100 px-1 rounded text-xs">{math}</code>;
          }
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
}
