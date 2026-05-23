"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { SKILLS, getAllSkills, type Question } from "@/lib/skills";
import { InlineMath, BlockMath } from "react-katex";

type FormState = {
  source_test: string;
  source_module: string;
  source_question_number: string;
  section: "reading_writing" | "math";
  skill: string;
  difficulty: "easy" | "medium" | "hard";
  prompt: string;
  prompt_latex: string;
  prompt_image_url: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  spr_answer: string;
  correct_answer: string;
  explanation: string;
  is_published: boolean;
  visibility: "free" | "premium";
  passage_text: string;
};

const blank: FormState = {
  source_test: "CB Practice Test 4",
  source_module: "",
  source_question_number: "",
  section: "reading_writing",
  skill: "",
  difficulty: "medium",
  prompt: "",
  prompt_latex: "",
  prompt_image_url: "",
  choice_a: "",
  choice_b: "",
  choice_c: "",
  choice_d: "",
  spr_answer: "",
  correct_answer: "A",
  explanation: "",
  is_published: false,
  visibility: "free",
  passage_text: "",
};

export default function QuestionForm({
  existing,
  existingPassage,
}: {
  existing?: Question | null;
  existingPassage?: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState<FormState>(
    existing
      ? {
          source_test: existing.source_test,
          source_module: existing.source_module ?? "",
          source_question_number: existing.source_question_number?.toString() ?? "",
          section: existing.section,
          skill: existing.skill,
          difficulty: existing.difficulty,
          prompt: existing.prompt,
          prompt_latex: existing.prompt_latex ?? "",
          prompt_image_url: existing.prompt_image_url ?? "",
          choice_a: existing.choice_a ?? "",
          choice_b: existing.choice_b ?? "",
          choice_c: existing.choice_c ?? "",
          choice_d: existing.choice_d ?? "",
          spr_answer: existing.spr_answer ?? "",
          correct_answer: existing.correct_answer,
          explanation: existing.explanation,
          is_published: existing.is_published,
          visibility: existing.visibility ?? "free",
          passage_text: existingPassage ?? "",
        }
      : blank
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [questionType, setQuestionType] = useState<"mcq" | "spr">(
    existing?.spr_answer ? "spr" : "mcq"
  );

  const update = (patch: Partial<FormState>) => setForm({ ...form, ...patch });

  // Reset skill if section changes (skill domain depends on section)
  useEffect(() => {
    const skillsInSection = getAllSkills(form.section);
    if (form.skill && !skillsInSection.find((s) => s.id === form.skill)) {
      update({ skill: "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.section]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    setError(null);

    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const { data, error: uploadError } = await supabase.storage
      .from("question-images")
      .upload(fileName, file);

    if (uploadError) {
      setError("Image upload failed: " + uploadError.message);
      setImageUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("question-images")
      .getPublicUrl(data.path);

    update({ prompt_image_url: urlData.publicUrl });
    setImageUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // Validation
    if (!form.skill) {
      setError("Please select a skill.");
      setSaving(false);
      return;
    }
    if (!form.prompt.trim()) {
      setError("Question prompt is required.");
      setSaving(false);
      return;
    }
    if (!form.explanation.trim()) {
      setError("Explanation is required.");
      setSaving(false);
      return;
    }
    if (questionType === "mcq") {
      if (!form.choice_a || !form.choice_b || !form.choice_c || !form.choice_d) {
        setError("All 4 answer choices are required.");
        setSaving(false);
        return;
      }
      if (!["A", "B", "C", "D"].includes(form.correct_answer)) {
        setError("Correct answer must be A, B, C, or D.");
        setSaving(false);
        return;
      }
    } else {
      if (!form.spr_answer.trim()) {
        setError("Student-produced response answer is required.");
        setSaving(false);
        return;
      }
    }

    // Handle passage (R&W only, optional)
    let passageId: number | null = existing?.passage_id ?? null;
    if (form.section === "reading_writing" && form.passage_text.trim()) {
      if (existing?.passage_id) {
        // Update existing passage
        await supabase
          .from("passages")
          .update({ content: form.passage_text })
          .eq("id", existing.passage_id);
        passageId = existing.passage_id;
      } else {
        const { data: passageData, error: passageError } = await supabase
          .from("passages")
          .insert({ content: form.passage_text })
          .select()
          .single();
        if (passageError) {
          setError("Saving passage failed: " + passageError.message);
          setSaving(false);
          return;
        }
        passageId = passageData.id;
      }
    } else if (form.section === "math") {
      passageId = null;
    }

    const payload = {
      source_test: form.source_test,
      source_module: form.source_module || null,
      source_question_number: form.source_question_number
        ? parseInt(form.source_question_number)
        : null,
      section: form.section,
      skill: form.skill,
      difficulty: form.difficulty,
      passage_id: passageId,
      prompt: form.prompt,
      prompt_latex: form.prompt_latex || null,
      prompt_image_url: form.prompt_image_url || null,
      choice_a: questionType === "mcq" ? form.choice_a : null,
      choice_b: questionType === "mcq" ? form.choice_b : null,
      choice_c: questionType === "mcq" ? form.choice_c : null,
      choice_d: questionType === "mcq" ? form.choice_d : null,
      spr_answer: questionType === "spr" ? form.spr_answer : null,
      correct_answer:
        questionType === "mcq" ? form.correct_answer : form.spr_answer,
      explanation: form.explanation,
      is_published: form.is_published,
      visibility: form.visibility,
    };

    if (existing) {
      const { error: updateError } = await supabase
        .from("questions")
        .update(payload)
        .eq("id", existing.id);
      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase
        .from("questions")
        .insert(payload);
      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }
    }

    router.push("/admin/questions");
    router.refresh();
  };

  const handleDelete = async () => {
    if (!existing) return;
    if (!confirm("Delete this question permanently? This cannot be undone.")) return;
    setSaving(true);
    const { error: deleteError } = await supabase
      .from("questions")
      .delete()
      .eq("id", existing.id);
    if (deleteError) {
      setError(deleteError.message);
      setSaving(false);
      return;
    }
    router.push("/admin/questions");
    router.refresh();
  };

  const skillsInSection = SKILLS[form.section];

  return (
    <form onSubmit={handleSubmit} className="p-10 max-w-4xl space-y-6">
      <div className="flex justify-between items-center mb-2">
        <h1 className="font-display text-3xl font-semibold text-coffee-900">
          {existing ? `Edit question #${existing.id}` : "Add a new question"}
        </h1>
      </div>

      {/* SOURCE */}
      <Section title="Source">
        <Grid3>
          <Field label="Source test">
            <select
              value={form.source_test}
              onChange={(e) => update({ source_test: e.target.value })}
            >
              {[4, 5, 6, 7, 8, 9, 10, 11].map((n) => (
                <option key={n} value={`CB Practice Test ${n}`}>
                  CB Practice Test {n}
                </option>
              ))}
              <option value="Original">Original question</option>
            </select>
          </Field>
          <Field label="Module (optional)">
            <select
              value={form.source_module}
              onChange={(e) => update({ source_module: e.target.value })}
            >
              <option value="">—</option>
              <option value="R&W Module 1">R&W Module 1</option>
              <option value="R&W Module 2">R&W Module 2</option>
              <option value="Math Module 1">Math Module 1</option>
              <option value="Math Module 2">Math Module 2</option>
            </select>
          </Field>
          <Field label="Question # (optional)">
            <input
              type="number"
              min={1}
              value={form.source_question_number}
              onChange={(e) => update({ source_question_number: e.target.value })}
              placeholder="e.g. 14"
            />
          </Field>
        </Grid3>
      </Section>

      {/* CLASSIFICATION */}
      <Section title="Classification">
        <Grid3>
          <Field label="Section">
            <select
              value={form.section}
              onChange={(e) =>
                update({ section: e.target.value as "reading_writing" | "math" })
              }
            >
              <option value="reading_writing">Reading & Writing</option>
              <option value="math">Math</option>
            </select>
          </Field>
          <Field label="Skill">
            <select
              value={form.skill}
              onChange={(e) => update({ skill: e.target.value })}
              required
            >
              <option value="">Select a skill...</option>
              {Object.entries(skillsInSection).map(([domain, skills]) => (
                <optgroup key={domain} label={domain}>
                  {(skills as readonly { id: string; label: string }[]).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>
          <Field label="Difficulty">
            <select
              value={form.difficulty}
              onChange={(e) =>
                update({ difficulty: e.target.value as "easy" | "medium" | "hard" })
              }
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </Field>
        </Grid3>
      </Section>

      {/* PASSAGE (R&W only) */}
      {form.section === "reading_writing" && (
        <Section title="Passage (optional)">
          <Field label="Passage text — leave blank if this question doesn't reference a passage">
            <textarea
              value={form.passage_text}
              onChange={(e) => update({ passage_text: e.target.value })}
              rows={6}
              placeholder="Paste the reading passage here..."
            />
          </Field>
        </Section>
      )}

      {/* PROMPT */}
      <Section title="Question content">
        <Field label="Prompt (the question itself)">
          <textarea
            value={form.prompt}
            onChange={(e) => update({ prompt: e.target.value })}
            rows={4}
            required
            placeholder="e.g. Which choice completes the text with the most logical transition?"
          />
        </Field>

        <Field label="LaTeX equation (optional — for math)">
          <textarea
            value={form.prompt_latex}
            onChange={(e) => update({ prompt_latex: e.target.value })}
            rows={2}
            placeholder="e.g. \frac{x^2 + 3x}{2} = 10"
            style={{ fontFamily: "monospace" }}
          />
          {form.prompt_latex && (
            <div className="mt-3 p-4 bg-cream-100 rounded-lg border border-coffee-700/10">
              <div className="text-xs text-coffee-600 mb-2">Live preview:</div>
              <BlockMath math={form.prompt_latex} errorColor="#cc0000" />
            </div>
          )}
        </Field>

        <Field label="Image (optional — for charts, figures, geometry)">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={imageUploading}
          />
          {imageUploading && (
            <div className="text-sm text-coffee-600 mt-2">Uploading…</div>
          )}
          {form.prompt_image_url && (
            <div className="mt-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.prompt_image_url}
                alt="Question figure"
                className="max-w-sm rounded-lg border border-coffee-700/10"
              />
              <button
                type="button"
                onClick={() => update({ prompt_image_url: "" })}
                className="block mt-2 text-xs text-red-700 hover:underline"
              >
                Remove image
              </button>
            </div>
          )}
        </Field>
      </Section>

      {/* QUESTION TYPE TOGGLE (Math can be SPR) */}
      {form.section === "math" && (
        <Section title="Question type">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setQuestionType("mcq")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                questionType === "mcq"
                  ? "bg-coffee-800 text-cream-50"
                  : "bg-cream-100 text-coffee-700 hover:bg-cream-200"
              }`}
            >
              Multiple choice
            </button>
            <button
              type="button"
              onClick={() => setQuestionType("spr")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                questionType === "spr"
                  ? "bg-coffee-800 text-cream-50"
                  : "bg-cream-100 text-coffee-700 hover:bg-cream-200"
              }`}
            >
              Student-produced response (type-in)
            </button>
          </div>
        </Section>
      )}

      {/* CHOICES or SPR */}
      {questionType === "mcq" ? (
        <Section title="Answer choices">
          {["A", "B", "C", "D"].map((letter) => {
            const key = `choice_${letter.toLowerCase()}` as keyof FormState;
            return (
              <Field key={letter} label={`Choice ${letter}`}>
                <input
                  type="text"
                  value={form[key] as string}
                  onChange={(e) => update({ [key]: e.target.value } as Partial<FormState>)}
                  placeholder={`Choice ${letter} text`}
                />
              </Field>
            );
          })}
          <Field label="Correct answer">
            <div className="flex gap-2">
              {["A", "B", "C", "D"].map((letter) => (
                <button
                  key={letter}
                  type="button"
                  onClick={() => update({ correct_answer: letter })}
                  className={`w-12 h-12 rounded-lg font-display font-semibold transition ${
                    form.correct_answer === letter
                      ? "bg-coffee-800 text-cream-50"
                      : "bg-cream-100 text-coffee-700 hover:bg-cream-200"
                  }`}
                >
                  {letter}
                </button>
              ))}
            </div>
          </Field>
        </Section>
      ) : (
        <Section title="Student-produced response">
          <Field label="Correct answer (the exact value the student should type)">
            <input
              type="text"
              value={form.spr_answer}
              onChange={(e) => update({ spr_answer: e.target.value })}
              placeholder="e.g. 0.5 or 12 or 3/4"
            />
          </Field>
        </Section>
      )}

      {/* EXPLANATION */}
      <Section title="Explanation">
        <Field label="Explanation shown to students after they answer (required)">
          <textarea
            value={form.explanation}
            onChange={(e) => update({ explanation: e.target.value })}
            rows={6}
            required
            placeholder="Paste or write the full explanation. This is shown to the student after they submit their answer. You can include LaTeX inline like $\frac{1}{2}$ if needed."
          />
        </Field>
      </Section>

      {/* PUBLISH + VISIBILITY */}
      <Section title="Visibility">
        <label className="flex items-center gap-3 cursor-pointer mb-4">
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(e) => update({ is_published: e.target.checked })}
            className="w-5 h-5"
            style={{ width: "auto" }}
          />
          <span className="text-sm text-coffee-800">
            <strong>Publish</strong> — make this question available to use in drills and tests
          </span>
        </label>

        <Field label="Who can see this question?">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => update({ visibility: "free" })}
              className={`text-left p-4 rounded-xl border-2 transition ${
                form.visibility === "free"
                  ? "border-coffee-800 bg-cream-200"
                  : "border-coffee-700/10 bg-cream-50 hover:border-beige-400"
              }`}
            >
              <div className="font-medium text-coffee-900 text-sm">🆓 Free for everyone</div>
              <div className="text-xs text-coffee-600 mt-0.5">
                Any student, even on the free plan, can get this question.
              </div>
            </button>
            <button
              type="button"
              onClick={() => update({ visibility: "premium" })}
              className={`text-left p-4 rounded-xl border-2 transition ${
                form.visibility === "premium"
                  ? "border-coffee-800 bg-cream-200"
                  : "border-coffee-700/10 bg-cream-50 hover:border-beige-400"
              }`}
            >
              <div className="font-medium text-coffee-900 text-sm">⭐ Premium only</div>
              <div className="text-xs text-coffee-600 mt-0.5">
                Only students with lifetime access can get this question.
              </div>
            </button>
          </div>
        </Field>
      </Section>

      {/* ERROR */}
      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </div>
      )}

      {/* ACTIONS */}
      <div className="flex justify-between items-center pt-4 border-t border-coffee-700/10">
        <div>
          {existing && (
            <button
              type="button"
              onClick={handleDelete}
              className="text-red-700 hover:text-red-900 text-sm"
            >
              Delete question
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 rounded-full text-sm font-medium text-coffee-700 hover:bg-cream-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || imageUploading}
            className="bg-coffee-800 hover:bg-coffee-900 disabled:opacity-50 text-cream-50 px-6 py-2.5 rounded-full text-sm font-medium transition"
          >
            {saving ? "Saving…" : existing ? "Save changes" : "Save question"}
          </button>
        </div>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-cream-50 border border-coffee-700/10 rounded-2xl p-6 space-y-4">
      <h2 className="font-display font-semibold text-lg text-coffee-900">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label>{label}</label>
      {children}
    </div>
  );
}

function Grid3({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-3 gap-3">{children}</div>;
}
