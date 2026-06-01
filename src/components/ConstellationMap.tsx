"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase-client";

type Star = {
  id: number;
  word: string;
  definition: string | null;
  example: string | null;
  state: "new" | "learning" | "due" | "mastered";
  x: number; // 0-1000 within viewBox
  y: number;
  twinkle: number; // animation delay
};

const COLORS = {
  new: "#7DA3D9",         // dim blue
  learning: "#E8C56A",    // amber
  due: "#E07B6A",         // soft red
  mastered: "#F5EFE4",    // bright cream
};

export default function ConstellationMap({
  userId,
  counts,
  totalWords,
}: {
  userId: string;
  counts: { new: number; learning: number; due: number; mastered: number };
  totalWords: number;
}) {
  const supabase = createClient();
  const [stars, setStars] = useState<Star[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Star | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("user_vocab")
        .select("id, word, definition, example, mastery_state")
        .eq("user_id", userId)
        .limit(500);
      const seeded: Star[] = (data ?? []).map((w: any, i: number) => {
        // Deterministic-ish pseudo-random placement using the id
        const s = (w.id * 9301 + 49297) % 233280;
        const r1 = (s % 1000) / 1000;
        const r2 = ((s * 7) % 1000) / 1000;
        const r3 = ((s * 13) % 1000) / 1000;
        return {
          id: w.id,
          word: w.word,
          definition: w.definition,
          example: w.example,
          state: (w.mastery_state ?? "new") as Star["state"],
          // Place within a 1000x600 canvas; cluster slightly toward center
          x: 80 + r1 * 840,
          y: 60 + r2 * 480,
          twinkle: r3 * 4,
        };
      });
      setStars(seeded);
      setLoading(false);
    })();
  }, [userId, supabase]);

  const radiusFor = (state: Star["state"]) => {
    if (state === "mastered") return 3.5;
    if (state === "due") return 3;
    if (state === "learning") return 2.5;
    return 2;
  };
  const opacityFor = (state: Star["state"]) => {
    if (state === "mastered") return 1;
    if (state === "due") return 0.85;
    if (state === "learning") return 0.7;
    return 0.5;
  };

  return (
    <div className="bg-coffee-900 rounded-3xl overflow-hidden relative" style={{ minHeight: 420 }}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-5 z-10 pointer-events-none">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-cream-200/60 font-semibold mb-1">
              Your Vocabulary
            </div>
            <h2 className="font-display text-2xl font-semibold text-cream-50">
              Constellation
            </h2>
            <p className="text-xs text-cream-200/60 mt-1 max-w-xs">
              Every word you've learned is a star. The brighter it shines, the better you know it.
            </p>
          </div>
          <div className="flex gap-3 text-[10px]">
            <Legend color={COLORS.new} label="New" />
            <Legend color={COLORS.learning} label="Learning" />
            <Legend color={COLORS.due} label="Due" />
            <Legend color={COLORS.mastered} label="Mastered" />
          </div>
        </div>
      </div>

      {/* Stars */}
      {loading ? (
        <div className="h-[420px] grid place-items-center">
          <div className="text-cream-200/60 text-sm">Loading your constellation…</div>
        </div>
      ) : stars.length === 0 ? (
        <div className="h-[420px] grid place-items-center p-8">
          <div className="text-center max-w-sm">
            <div className="text-5xl mb-3">✨</div>
            <div className="text-cream-50 font-display text-lg mb-1">Your sky is empty</div>
            <p className="text-cream-200/60 text-sm">
              Save some words from passages or pick a list — they'll appear here as stars.
            </p>
          </div>
        </div>
      ) : (
        <svg
          ref={svgRef}
          viewBox="0 0 1000 600"
          className="w-full"
          style={{ display: "block", height: "auto", aspectRatio: "1000 / 600" }}
        >
          {/* Background nebula glow */}
          <defs>
            <radialGradient id="nebula1" cx="30%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#B5895D" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#B5895D" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="nebula2" cx="75%" cy="65%" r="40%">
              <stop offset="0%" stopColor="#8B6B4A" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#8B6B4A" stopOpacity="0" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect width="1000" height="600" fill="url(#nebula1)" />
          <rect width="1000" height="600" fill="url(#nebula2)" />

          {/* Faint background micro-stars for atmosphere */}
          {Array.from({ length: 80 }).map((_, i) => {
            const x = (i * 91) % 1000;
            const y = (i * 53 + 30) % 600;
            return <circle key={`bg${i}`} cx={x} cy={y} r="0.6" fill="#F5EFE4" opacity={0.15} />;
          })}

          {/* Constellation lines between mastered stars (nearest 2 each) */}
          {(() => {
            const mastered = stars.filter((s) => s.state === "mastered");
            const lines: JSX.Element[] = [];
            mastered.forEach((s, i) => {
              const others = mastered
                .map((o, j) => ({ o, j, d: Math.hypot(o.x - s.x, o.y - s.y) }))
                .filter((x) => x.j !== i)
                .sort((a, b) => a.d - b.d)
                .slice(0, 2);
              others.forEach((n) => {
                if (n.d < 200 && i < n.j) {
                  lines.push(
                    <line
                      key={`l${i}-${n.j}`}
                      x1={s.x}
                      y1={s.y}
                      x2={n.o.x}
                      y2={n.o.y}
                      stroke="#F5EFE4"
                      strokeWidth="0.4"
                      opacity={0.25}
                    />
                  );
                }
              });
            });
            return lines;
          })()}

          {/* Stars */}
          {stars.map((s) => (
            <g
              key={s.id}
              onClick={() => setSelected(s)}
              style={{ cursor: "pointer" }}
            >
              {/* outer halo for mastered/due */}
              {(s.state === "mastered" || s.state === "due") && (
                <circle
                  cx={s.x}
                  cy={s.y}
                  r={radiusFor(s.state) * 3.5}
                  fill={COLORS[s.state]}
                  opacity={0.12}
                />
              )}
              <circle
                cx={s.x}
                cy={s.y}
                r={radiusFor(s.state)}
                fill={COLORS[s.state]}
                opacity={opacityFor(s.state)}
                filter={s.state === "mastered" ? "url(#glow)" : undefined}
              >
                <animate
                  attributeName="opacity"
                  values={`${opacityFor(s.state) * 0.6};${opacityFor(s.state)};${opacityFor(s.state) * 0.6}`}
                  dur={`${3 + s.twinkle}s`}
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          ))}
        </svg>
      )}

      {/* Footer stats */}
      <div className="px-5 py-3 border-t border-cream-50/10 flex items-center justify-between text-xs text-cream-200/60">
        <span>{stars.length} stars · click any star for the word</span>
        <span>{counts.mastered} mastered</span>
      </div>

      {/* Selected star popup */}
      {selected && (
        <div
          className="absolute inset-0 bg-coffee-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-20"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-cream-50 rounded-2xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-accent font-semibold">
                  {selected.state}
                </div>
                <div className="font-display text-2xl font-semibold text-coffee-900">
                  {selected.word}
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-coffee-500 hover:text-coffee-900 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <p className="text-coffee-800 text-sm leading-relaxed">
              {selected.definition}
            </p>
            {selected.example && (
              <p className="mt-3 text-coffee-600 text-xs italic">
                "{selected.example}"
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-cream-200/70">
      <div className="w-2 h-2 rounded-full" style={{ background: color }} />
      <span>{label}</span>
    </div>
  );
}
