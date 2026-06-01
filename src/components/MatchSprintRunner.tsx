"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase-client";

type Word = { id: number; word: string; definition: string };

type Card =
  | { kind: "word"; pairId: number; text: string }
  | { kind: "def"; pairId: number; text: string };

const ROUND_SECONDS = 60;
const PAIRS_PER_ROUND = 5;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MatchSprintRunner({
  userId,
  pool,
}: {
  userId: string;
  pool: Word[];
}) {
  const supabase = createClient();
  const [phase, setPhase] = useState<"ready" | "playing" | "done">("ready");
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set()); // pairIds matched
  const [wrongFlash, setWrongFlash] = useState<[number, number] | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Build a fresh batch of cards
  const dealRound = () => {
    const picks = shuffle(pool).slice(0, PAIRS_PER_ROUND);
    const fresh: Card[] = [];
    picks.forEach((w, i) => {
      fresh.push({ kind: "word", pairId: i, text: w.word });
      fresh.push({ kind: "def", pairId: i, text: w.definition });
    });
    setCards(shuffle(fresh));
    setSelectedIdx(null);
    setMatched(new Set());
    setWrongFlash(null);
  };

  const start = () => {
    dealRound();
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setSecondsLeft(ROUND_SECONDS);
    setPhase("playing");
  };

  // Game timer
  useEffect(() => {
    if (phase !== "playing") return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setPhase("done");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  // When all pairs matched, deal another round
  useEffect(() => {
    if (phase !== "playing") return;
    if (cards.length > 0 && matched.size === cards.length / 2) {
      // small delay so the last match is visible
      const t = setTimeout(() => dealRound(), 350);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matched, cards.length, phase]);

  // Save score when round ends
  useEffect(() => {
    if (phase !== "done") return;
    (async () => {
      // Award XP via the existing gamification helper
      try {
        const { awardProgress } = await import("@/lib/gamification");
        await awardProgress({ userId, xpEarned: score });
      } catch {}
    })();
  }, [phase, score, userId]);

  const handleClick = (i: number) => {
    if (phase !== "playing") return;
    const card = cards[i];
    if (matched.has(card.pairId)) return;
    if (selectedIdx === null) {
      setSelectedIdx(i);
      return;
    }
    if (selectedIdx === i) {
      setSelectedIdx(null);
      return;
    }
    const a = cards[selectedIdx];
    const b = card;
    if (a.pairId === b.pairId && a.kind !== b.kind) {
      // match!
      const newMatched = new Set(matched);
      newMatched.add(a.pairId);
      setMatched(newMatched);
      const newStreak = streak + 1;
      setStreak(newStreak);
      setBestStreak(Math.max(bestStreak, newStreak));
      // Score: 10 per match + streak bonus
      setScore((s) => s + 10 + Math.min(newStreak * 2, 20));
      setSelectedIdx(null);
    } else {
      // miss
      setWrongFlash([selectedIdx, i]);
      setStreak(0);
      setTimeout(() => {
        setWrongFlash(null);
        setSelectedIdx(null);
      }, 600);
    }
  };

  if (phase === "ready") {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-coffee-900 to-coffee-800 text-cream-50 rounded-3xl p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="text-5xl mb-3">⚡</div>
            <h1 className="font-display text-3xl font-semibold mb-2">Match Sprint</h1>
            <p className="text-cream-200/80 mb-1">
              Pair every word with its definition. As fast as you can.
            </p>
            <p className="text-cream-200/60 text-sm mb-7">
              {ROUND_SECONDS} seconds · pairs keep coming · streaks multiply your score.
            </p>
            <button
              onClick={start}
              className="bg-accent hover:bg-accent/90 text-cream-50 px-8 py-3.5 rounded-full text-base font-medium hover:scale-[1.03] transition shadow-lg"
            >
              ▶ Start Sprint
            </button>
            <div className="mt-5">
              <Link href="/app/vocabulary" className="text-sm text-cream-200/60 hover:text-cream-50">
                ← Back
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-cream-50 border border-coffee-700/10 rounded-3xl p-10 text-center">
          <div className="text-5xl mb-3">🏁</div>
          <h1 className="font-display text-3xl font-semibold text-coffee-900 mb-1">Time!</h1>
          <p className="text-coffee-600 mb-7">Here's how you did.</p>
          <div className="grid grid-cols-3 gap-4 mb-7">
            <Stat label="Score" value={score} />
            <Stat label="Best streak" value={bestStreak} />
            <Stat label="XP earned" value={score} accent />
          </div>
          <div className="flex justify-center gap-3">
            <button
              onClick={start}
              className="bg-coffee-800 hover:bg-coffee-900 text-cream-50 px-5 py-2.5 rounded-full text-sm font-medium hover:scale-[1.02] transition"
            >
              ↻ Play again
            </button>
            <Link
              href="/app/vocabulary"
              className="bg-cream-100 hover:bg-cream-200 text-coffee-800 px-5 py-2.5 rounded-full text-sm font-medium hover:scale-[1.02] transition"
            >
              Done
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Playing
  return (
    <div className="min-h-[calc(100vh-65px)] flex flex-col">
      {/* HUD */}
      <div className="px-6 py-4 border-b border-coffee-700/10">
        <div className="flex items-center justify-between max-w-4xl mx-auto gap-4">
          <Link href="/app/vocabulary" className="text-sm text-coffee-600 hover:text-coffee-900">
            ← Exit
          </Link>
          <div className="flex items-center gap-5">
            <div className="text-center">
              <div className="font-display text-2xl font-semibold text-coffee-900 leading-none">
                {secondsLeft}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-coffee-500">sec</div>
            </div>
            <div className="text-center">
              <div className="font-display text-2xl font-semibold text-coffee-900 leading-none">
                {score}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-coffee-500">score</div>
            </div>
            <div className="text-center">
              <div className="font-display text-2xl font-semibold text-accent leading-none">
                {streak > 0 ? `×${streak}` : "—"}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-coffee-500">streak</div>
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto mt-3 h-1.5 bg-cream-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent to-coffee-700 transition-all"
            style={{ width: `${(secondsLeft / ROUND_SECONDS) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 max-w-5xl mx-auto">
          {cards.map((c, i) => {
            const isMatched = matched.has(c.pairId);
            const isSelected = selectedIdx === i;
            const isWrong = wrongFlash && (wrongFlash[0] === i || wrongFlash[1] === i);
            return (
              <button
                key={i}
                onClick={() => handleClick(i)}
                disabled={isMatched}
                className={`text-left rounded-2xl p-4 border transition-all min-h-[110px] flex items-center text-sm ${
                  isMatched
                    ? "bg-green-50 border-green-200 opacity-60 cursor-default"
                    : isWrong
                    ? "bg-red-50 border-red-300 animate-pulse"
                    : isSelected
                    ? "bg-coffee-800 text-cream-50 border-coffee-900 scale-[1.02]"
                    : c.kind === "word"
                    ? "bg-cream-50 border-coffee-700/10 hover:scale-[1.02] hover:border-accent/40"
                    : "bg-cream-100 border-coffee-700/10 hover:scale-[1.02] hover:border-accent/40"
                }`}
              >
                {c.kind === "word" ? (
                  <span
                    className={`font-display font-semibold ${
                      isSelected ? "text-cream-50" : "text-coffee-900"
                    } text-lg`}
                  >
                    {c.text}
                  </span>
                ) : (
                  <span
                    className={`leading-snug ${
                      isSelected ? "text-cream-100" : "text-coffee-700"
                    }`}
                  >
                    {c.text}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 border ${accent ? "bg-gradient-to-br from-accent/15 to-cream-100 border-accent/30" : "bg-cream-100 border-coffee-700/10"}`}>
      <div className="text-[10px] uppercase tracking-wider text-coffee-500 font-semibold">{label}</div>
      <div className="font-display text-3xl font-semibold text-coffee-900">{value}</div>
    </div>
  );
}
