"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import { BlockMath } from "react-katex";
import type { Question } from "@/lib/skills";
import RichText from "@/components/RichText";

type Answer = {
  id: number;
  question_id: number;
  selected_answer: string | null;
  is_correct: boolean;
};

const LETTERS = ["A", "B", "C", "D"] as const;

export default function ResultsReview({
  answers,
  questions,
  passages,
  initialBookmarks,
}: {
  answers: Answer[];
  questions: Question[];
  passages: Record<number, string>;
  initialBookmarks: number[];
}) {
  const supabase = createClient();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [bookmarks, setBookmarks] = useState<Set<number>>(new Set(initialBookmarks));
  const [shareMsg, setShareMsg] = useState<number | null>(null);

  const questionById = (id: number) => questions.find((q) => q.id === id);

  const toggleBookmark = async (questionId: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const next = new Set(bookmarks);
    if (next.has(questionId)) {
      await supabase.from("bookmarks").delete()
        .eq("user_id", user.id).eq("question_id", questionId);
      next.delete(questionId);
    } else {
      await supabase.from("bookmarks")
        .insert({ user_id: user.id, question_id: questionId });
      next.add(questionId);
    }
    setBookmarks(next);
  };

  const shareToCommunity = (questionId: number) => {
    // Community chat is Phase 2 — for now, just acknowledge the action.
    setShareMsg(questionId);
    setTimeout(() => setShareMsg(null), 2500);
  };

  return (
    <div className="space-y-3">
      {answers.map((ans, idx) => {
        const q = questionById(ans.question_id);
        if (!q) return null;
        const isOpen = expanded === idx;
        const isSPR = q.section === "math" && !!q.spr_answer;

        return (
          <div
            key={ans.id}
            className="bg-cream-50 border border-coffee-700/10 rounded-2xl overflow-hidden"
          >
            {/* Header row */}
            <button
              onClick={() => setExpanded(isOpen ? null : idx)}
              className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-cream-100 transition"
            >
              <span className={`w-8 h-8 rounded-full grid place-items-center text-sm font-semibold shrink-0 ${
                ans.is_correct
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}>
                {ans.is_correct ? "✓" : "✗"}
              </span>
              <span className="font-medium text-coffee-900 text-sm">
                Question {idx + 1}
              </span>
              <span className="text-coffee-600 text-sm flex-1 truncate">
                {q.prompt}
              </span>
              <span className="text-coffee-500 text-xs">
                {isOpen ? "▲" : "▼"}
              </span>
            </button>

            {/* Expanded body */}
            {isOpen && (
              <div className="px-5 pb-5 border-t border-coffee-700/10 pt-4">
                {/* Passage */}
                {q.passage_id && passages[q.passage_id] && (
                  <div className="bg-cream-100 rounded-lg p-4 mb-4 text-sm text-coffee-700 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {passages[q.passage_id]}
                  </div>
                )}

                {/* Prompt */}
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

                {/* Choices with right/wrong marking */}
                {isSPR ? (
                  <div className="space-y-1.5 mb-4 text-sm">
                    <div className="text-coffee-700">
                      Your answer:{" "}
                      <span className={ans.is_correct ? "text-green-700 font-medium" : "text-red-700 font-medium"}>
                        {ans.selected_answer || "(blank)"}
                      </span>
                    </div>
                    {!ans.is_correct && (
                      <div className="text-coffee-700">
                        Correct answer:{" "}
                        <span className="text-green-700 font-medium">{q.spr_answer}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5 mb-4">
                    {LETTERS.map((letter) => {
                      const choiceText = q[`choice_${letter.toLowerCase()}` as keyof Question] as string | null;
                      if (!choiceText) return null;
                      const isAnswer = letter === q.correct_answer;
                      const wasPicked = ans.selected_answer === letter;
                      let style = "bg-cream-100 text-coffee-700";
                      if (isAnswer) style = "bg-green-50 text-green-900 border border-green-300";
                      else if (wasPicked) style = "bg-red-50 text-red-900 border border-red-300";
                      return (
                        <div key={letter} className={`flex items-center gap-2 p-2.5 rounded-lg text-sm ${style}`}>
                          <span className="font-semibold w-5">{letter}</span>
                          <span className="flex-1"><RichText text={choiceText} /></span>
                          {isAnswer && <span className="text-green-700 text-xs font-medium">✓ Correct</span>}
                          {wasPicked && !isAnswer && <span className="text-red-700 text-xs font-medium">Your pick</span>}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Explanation */}
                <div className="bg-cream-100 rounded-xl p-4 mb-4">
                  <div className="text-xs text-coffee-600 uppercase tracking-wider mb-1.5">
                    Explanation
                  </div>
                  <div className="text-sm text-coffee-800 leading-relaxed">
                    <RichText text={q.explanation} />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleBookmark(q.id)}
                    className={`text-sm px-3 py-1.5 rounded-lg transition ${
                      bookmarks.has(q.id)
                        ? "bg-coffee-700 text-cream-50"
                        : "bg-cream-200 text-coffee-700 hover:bg-beige-300"
                    }`}
                  >
                    {bookmarks.has(q.id) ? "🔖 Saved for review" : "🔖 Save for later"}
                  </button>
                  <button
                    onClick={() => shareToCommunity(q.id)}
                    className="text-sm px-3 py-1.5 rounded-lg bg-cream-200 text-coffee-700 hover:bg-beige-300 transition"
                  >
                    💬 Share to community
                  </button>
                  {shareMsg === q.id && (
                    <span className="text-xs text-coffee-600 self-center">
                      Community chat opens in Phase 2 — sharing will be enabled then.
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
