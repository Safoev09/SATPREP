"use client";

import { InlineMath } from "react-katex";
import React from "react";

// Renders a string that may contain:
// - Inline LaTeX: $x^2$
// - Underline: <u>text</u>
// - Bold: **text**
// - Italic: *text*
// - Line breaks preserved

type Segment =
  | { type: "math"; content: string }
  | { type: "underline"; content: string }
  | { type: "bold"; content: string }
  | { type: "italic"; content: string }
  | { type: "text"; content: string };

function parseSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  // Match all special patterns
  const pattern = /(\$[^$]+\$)|(<u>[\s\S]*?<\/u>)|(\*\*[\s\S]*?\*\*)|(\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    // Add plain text before this match
    if (match.index > lastIndex) {
      segments.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }

    const m = match[0];
    if (m.startsWith("$") && m.endsWith("$")) {
      segments.push({ type: "math", content: m.slice(1, -1) });
    } else if (m.startsWith("<u>")) {
      segments.push({ type: "underline", content: m.slice(3, -4) });
    } else if (m.startsWith("**")) {
      segments.push({ type: "bold", content: m.slice(2, -2) });
    } else if (m.startsWith("*")) {
      segments.push({ type: "italic", content: m.slice(1, -1) });
    }

    lastIndex = match.index + m.length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    segments.push({ type: "text", content: text.slice(lastIndex) });
  }

  return segments;
}

export default function RichText({ text }: { text: string }) {
  if (!text) return null;

  const segments = parseSegments(text);

  return (
    <>
      {segments.map((seg, i) => {
        switch (seg.type) {
          case "math":
            try {
              return <InlineMath key={i} math={seg.content} />;
            } catch {
              return <span key={i}>${seg.content}$</span>;
            }
          case "underline":
            return <u key={i}>{seg.content}</u>;
          case "bold":
            return <strong key={i}>{seg.content}</strong>;
          case "italic":
            return <em key={i}>{seg.content}</em>;
          default:
            return (
              <span key={i} style={{ whiteSpace: "pre-wrap" }}>
                {seg.content}
              </span>
            );
        }
      })}
    </>
  );
}
