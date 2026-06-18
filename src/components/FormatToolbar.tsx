"use client";

import { useState } from "react";

// Reusable text formatting toolbar — wraps selected text with markdown-style
// markers that RichText.tsx already knows how to render:
//   <u>text</u>  → underline
//   **text**     → bold
//   *text*       → italic
// Used in both QuestionForm.tsx and InlineQuestionCreator.tsx so every
// place an admin types a question prompt gets the same toolbar.
export default function FormatToolbar({ textareaId }: { textareaId: string }) {
  const [justInserted, setJustInserted] = useState<string | null>(null);

  const wrap = (before: string, after: string, key: string) => {
    const el = document.getElementById(textareaId) as HTMLTextAreaElement | null;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = el.value.slice(start, end);

    // If nothing selected, just insert markers with cursor in between
    const insertText = selected ? `${before}${selected}${after}` : `${before}${after}`;
    const newValue = el.value.slice(0, start) + insertText + el.value.slice(end);

    // Fire a native input event so React's onChange picks it up
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
    setter?.call(el, newValue);
    el.dispatchEvent(new Event("input", { bubbles: true }));

    // Restore cursor position
    requestAnimationFrame(() => {
      el.focus();
      if (selected) {
        el.selectionStart = start + before.length;
        el.selectionEnd = start + before.length + selected.length;
      } else {
        el.selectionStart = el.selectionEnd = start + before.length;
      }
    });

    setJustInserted(key);
    setTimeout(() => setJustInserted(null), 400);
  };

  const buttons = [
    { key: "u", label: <u>U</u>, title: "Underline selected text", before: "<u>", after: "</u>" },
    { key: "b", label: <strong>B</strong>, title: "Bold selected text", before: "**", after: "**" },
    { key: "i", label: <em>I</em>, title: "Italic selected text", before: "*", after: "*" },
  ];

  return (
    <div className="flex items-center gap-1.5 mt-1.5 mb-1 flex-wrap">
      <span className="text-[10px] text-coffee-500 uppercase tracking-wide mr-1">Format:</span>
      {buttons.map((b) => (
        <button
          key={b.key}
          type="button"
          title={b.title}
          onClick={() => wrap(b.before, b.after, b.key)}
          className={`w-7 h-7 rounded-lg text-xs font-medium transition flex items-center justify-center border ${
            justInserted === b.key
              ? "bg-green-100 border-green-300 text-green-700"
              : "bg-cream-200 hover:bg-cream-300 text-coffee-700 border-coffee-700/10"
          }`}
        >
          {b.label}
        </button>
      ))}
      <span className="text-[10px] text-coffee-400 ml-1">Select text, then click — or click first to insert at cursor</span>
    </div>
  );
}
