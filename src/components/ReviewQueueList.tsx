"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { BlockMath } from "react-katex";
import type { Question } from "@/lib/skills";
import { getSkillLabel } from "@/lib/skills";
import RichText from "@/components/RichText";

const LETTERS = ["A", "B", "C", "D"] as const;

export default function ReviewQueueList({
  questions,
  passages,
}: {
  questions: Question[];
  passages: Record<number, string>;
}) {
  const supabase = createClient();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [removed, setRemoved] = useState<Set<number>>(new Set());
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  const remove = async (questionId: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("bookmarks")
      .delete()
      .eq("user_id", user.id)
      .eq("question_id", questionId);
    setRemoved((prev) => new Set(prev).add(questionId));
  };

  const visible = questions.filter((q) => !removed.has(q.id));

  return (
    <div className="space-y-3">
      <div className="text-sm text-coffee-600 mb-2">
        {visible.length} question{visible.length === 1 ? "" : "s"} saved
      </div>
      {visible.map((q, idx) => {
        const isOpen = expanded === q.id;
        const isSPR = q.section === "math" && !!q.spr_answer;
        const answerShown = revealed.has(q.id);

        return (
          <div
            key={q.id}
            className="bg-cream-50 border border-coffee-700/10 rounded-2xl overflow-hidden"
          >
            <button
              onClick={() => setExpanded(isOpen ? null : q.id)}
              className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-cream-100 transition"
            >
              <span className="w-8 h-8 rounded-full grid place-items-center text-sm font-semibold shrink-0 bg-cream-200 text-coffee-700">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-coffee-900 truncate">{q.prompt}</div>
                <div className="text-xs text-coffee-600">
                  {q.section === "math" ? "Math" : "R&W"} · {getSkillLabel(q.skill)} · {q.difficulty}
                </div>
              </div>
              <span className="text-coffee-500 text-xs">{isOpen ? "▲" : "▼"}</span>
            </button>

            {isOpen && (
              <div className="px-5 pb-5 border-t border-coffee-700/10 pt-4">
                {q.passage_id && passages[q.passage_id] && (
                  <div className="bg-cream-100 rounded-lg p-4 mb-4 text-sm text-coffee-700 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {passages[q.passage_id]}
                  </div>
                )}

                <div className="font-display text-coffee-900 mb-3">
                  <RichText text={q.prompt} />
                </div>

                {q.prompt_latex && (
                  <div className="bg-cream-100 rounded-lg p-3 mb-3 overflow-x-auto">
                    <BlockMath math={q.prompt_latex} errorColor="#cc0000" />
                  </div>
                )}

                {q.prompt_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={q.prompt_image_url} alt="Figure" className="max-w-full rounded-lg border border-coffee-700/10 mb-3" />
                )}

                {/* Choices */}
                {!isSPR && (
                  <div className="space-y-1.5 mb-4">
                    {LETTERS.map((letter) => {
                      const choiceText = q[`choice_${letter.toLowerCase()}` as keyof Question] as string | null;
                      if (!choiceText) return null;
                      const isAnswer = letter === q.correct_answer;
                      const style =
                        answerShown && isAnswer
                          ? "bg-green-50 text-green-900 border border-green-300"
                          : "bg-cream-100 text-coffee-700";
                      return (
                        <div key={letter} className={`flex items-center gap-2 p-2.5 rounded-lg text-sm ${style}`}>
                          <span className="font-semibold w-5">{letter}</span>
                          <span className="flex-1"><RichText text={choiceText} /></span>
                          {answerShown && isAnswer && (
                            <span className="text-green-700 text-xs font-medium">✓ Correct</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Reveal answer / explanation */}
                {!answerShown ? (
                  <button
                    onClick={() => setRevealed((prev) => new Set(prev).add(q.id))}
                    className="bg-coffee-800 hover:bg-coffee-900 text-cream-50 px-5 py-2 rounded-full text-sm font-medium mb-2"
                  >
                    Show answer & explanation
                  </button>
                ) : (
                  <>
                    {isSPR && (
                      <div className="text-sm text-coffee-800 mb-2">
                        Correct answer:{" "}
                        <span className="text-green-700 font-medium">{q.spr_answer}</span>
                      </div>
                    )}
                    <div className="bg-cream-100 rounded-xl p-4 mb-3">
                      <div className="text-xs text-coffee-600 uppercase tracking-wider mb-1.5">
                        Explanation
                      </div>
                      <div className="text-sm text-coffee-800 leading-relaxed">
                        <RichText text={q.explanation} />
                      </div>
                    </div>
                  </>
                )}

                <button
                  onClick={() => remove(q.id)}
                  className="text-sm text-red-700 hover:text-red-900"
                >
                  Remove from review queue
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
