"use client";

import { InlineMath } from "react-katex";
import React from "react";

// Renders a string that may contain inline LaTeX wrapped in single $...$.
// Example: "If $x = 2$ then $x^2 = 4$." renders the math parts properly.
export default function RichText({ text }: { text: string }) {
  if (!text) return null;

  // Split on $...$ segments
  const parts = text.split(/(\$[^$]+\$)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
          const math = part.slice(1, -1);
          try {
            return <InlineMath key={i} math={math} />;
          } catch {
            return <span key={i}>{part}</span>;
          }
        }
        // Preserve line breaks in plain text
        return (
          <span key={i} style={{ whiteSpace: "pre-wrap" }}>
            {part}
          </span>
        );
      })}
    </>
  );
}
