// SAT scoring logic for modules and full tests.
// These are approximations modeled on how the real digital SAT works:
// the test is 2-stage adaptive, and Module 2 difficulty affects the score ceiling.

// Real SAT section structure
export const RW_MODULE_SIZE = 27;
export const MATH_MODULE_SIZE = 22;
export const RW_MODULE_MINUTES = 32;
export const MATH_MODULE_MINUTES = 35;
export const BREAK_MINUTES = 10;

// Performance on Module 1 decides whether Module 2 is the "hard" or "easy" path.
// Real SAT uses a cutoff around 60-70% correct.
export const ADAPTIVE_CUTOFF = 0.6;

export function module2Path(module1Correct: number, module1Total: number): "hard" | "easy" {
  if (module1Total === 0) return "easy";
  return module1Correct / module1Total >= ADAPTIVE_CUTOFF ? "hard" : "easy";
}

// Convert raw correct count on a full section (both modules) into a 200-800 score.
// The "hard" Module 2 path raises the achievable ceiling; the "easy" path caps it lower,
// mirroring how the real adaptive test works.
export function sectionScore(
  totalCorrect: number,
  totalQuestions: number,
  module2: "hard" | "easy"
): number {
  if (totalQuestions === 0) return 200;
  const pct = totalCorrect / totalQuestions;

  if (module2 === "hard") {
    // Hard path: can reach the full 800, floor around 400
    const raw = 400 + pct * 400;
    return clampRound(raw);
  } else {
    // Easy path: ceiling around 600, floor 200
    const raw = 200 + pct * 400;
    return clampRound(raw);
  }
}

// Score a single standalone module (not adaptive) — simple 200-800 estimate.
export function standaloneModuleScore(
  correct: number,
  total: number,
  difficulty: "easy" | "medium" | "hard"
): number {
  if (total === 0) return 200;
  const pct = correct / total;
  // Harder modules give a higher ceiling for the same percentage
  const ceilingBonus = difficulty === "hard" ? 800 : difficulty === "medium" ? 700 : 600;
  const raw = 200 + pct * (ceilingBonus - 200);
  return clampRound(raw);
}

function clampRound(raw: number): number {
  const clamped = Math.max(200, Math.min(800, raw));
  return Math.round(clamped / 10) * 10; // round to nearest 10, like real SAT
}

export type FullTestScore = {
  rwScore: number;
  mathScore: number;
  totalScore: number;
  rwModule2: "hard" | "easy";
  mathModule2: "hard" | "easy";
};
