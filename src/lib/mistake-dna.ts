// ================================================================
// SATPeaK — Mistake DNA Engine
// Analyzes answer patterns to identify WHY a student is losing points.
// No external APIs — pure algorithmic analysis.
// ================================================================

export type DNACategory =
  | "knowledge_gaps"
  | "careless"
  | "time_mgmt"
  | "vocab"
  | "reading_comp"
  | "advanced_math"
  | "geometry"
  | "problem_solving";

export type DNAWeakness = {
  category: DNACategory;
  label: string;
  icon: string;
  score: number;        // 0-100, lower = worse
  pointsLost: number;   // estimated SAT points lost
  confidence: number;   // 0-100 how confident we are in this diagnosis
  recommendation: string;
  sessionsNeeded: number;
  evidence: string;     // specific data backing this up
};

export type MistakeDNA = {
  // Per-category scores
  scores: Record<DNACategory, number>;
  pointsLost: Record<DNACategory, number>;

  // Aggregates
  overallConfidence: number;
  weeklyTrend: number;        // positive = improving
  totalAnswers: number;
  totalCorrect: number;

  // Top weaknesses sorted by impact
  topWeaknesses: DNAWeakness[];

  // Summary
  biggestWin: DNAWeakness | null;  // fix this one thing for biggest score gain
  estimatedCurrentScore: number | null;
  estimatedPotentialScore: number | null;
};

type RawAnswer = {
  is_correct: boolean;
  time_spent_seconds: number | null;
  was_changed: boolean | null;
  was_skipped: boolean | null;
  flagged_for_review: boolean | null;
  difficulty: string | null;
  section: string | null;
  skill: string | null;
};

// ---- Category metadata ----
export const DNA_META: Record<DNACategory, { label: string; icon: string; color: string; desc: string }> = {
  knowledge_gaps:   { label: "Knowledge Gaps",          icon: "🧩", color: "#E85D4A", desc: "Concepts you haven't learned yet" },
  careless:         { label: "Careless Mistakes",        icon: "⚡", color: "#F59E0B", desc: "You knew it but got it wrong anyway" },
  time_mgmt:        { label: "Time Management",          icon: "⏱️", color: "#8B5CF6", desc: "Running out of time or rushing" },
  vocab:            { label: "Vocabulary Weakness",      icon: "📖", color: "#EC4899", desc: "Unfamiliar words costing you points" },
  reading_comp:     { label: "Reading Comprehension",    icon: "📄", color: "#06B6D4", desc: "Struggling with complex passages" },
  advanced_math:    { label: "Advanced Math",            icon: "📐", color: "#10B981", desc: "Nonlinear, quadratics, functions" },
  geometry:         { label: "Geometry & Trig",          icon: "📏", color: "#3B82F6", desc: "Shapes, angles, triangles, circles" },
  problem_solving:  { label: "Problem Solving",          icon: "🔢", color: "#F97316", desc: "Data analysis, rates, percentages" },
};

// ---- SAT skill → DNA category mapping ----
const SKILL_TO_CATEGORY: Record<string, DNACategory> = {
  // Knowledge gaps (R&W structural)
  central_ideas: "knowledge_gaps",
  command_of_evidence: "knowledge_gaps",
  inferences: "knowledge_gaps",
  // Reading comprehension
  text_structure: "reading_comp",
  cross_text: "reading_comp",
  rhetorical_synthesis: "reading_comp",
  // Vocab
  words_in_context: "vocab",
  transitions: "vocab",
  // Grammar (careless if wrong)
  boundaries: "careless",
  form_structure_sense: "careless",
  // Math categories
  linear_equations_one: "knowledge_gaps",
  linear_equations_two: "knowledge_gaps",
  linear_functions: "knowledge_gaps",
  systems_linear: "knowledge_gaps",
  linear_inequalities: "knowledge_gaps",
  equivalent_expressions: "advanced_math",
  nonlinear_equations: "advanced_math",
  nonlinear_functions: "advanced_math",
  ratios_rates_proportions: "problem_solving",
  percentages: "problem_solving",
  one_variable_data: "problem_solving",
  two_variable_data: "problem_solving",
  probability: "problem_solving",
  inference_stats: "problem_solving",
  evaluating_claims: "problem_solving",
  area_volume: "geometry",
  lines_angles_triangles: "geometry",
  right_triangles_trig: "geometry",
  circles: "geometry",
};

// ---- Points-lost estimation ----
// Each SAT section is worth up to 800 points.
// Rough: each skill has ~4 questions, worth ~20-40 points if all wrong.
const CATEGORY_MAX_LOSS: Record<DNACategory, number> = {
  knowledge_gaps: 120,
  careless: 80,
  time_mgmt: 100,
  vocab: 60,
  reading_comp: 90,
  advanced_math: 80,
  geometry: 60,
  problem_solving: 70,
};

// ---- Core computation ----
export function computeMistakeDNA(
  answers: RawAnswer[],
  previousScore: number | null,
  weeklyAnswers?: RawAnswer[],  // last 7 days for trend
): MistakeDNA {
  const total = answers.length;
  const correct = answers.filter(a => a.is_correct).length;

  if (total < 5) {
    // Not enough data for meaningful analysis
    return {
      scores: Object.fromEntries(
        Object.keys(DNA_META).map(k => [k, 100])
      ) as Record<DNACategory, number>,
      pointsLost: Object.fromEntries(
        Object.keys(DNA_META).map(k => [k, 0])
      ) as Record<DNACategory, number>,
      overallConfidence: Math.round((total / 5) * 30),
      weeklyTrend: 0,
      totalAnswers: total,
      totalCorrect: correct,
      topWeaknesses: [],
      biggestWin: null,
      estimatedCurrentScore: previousScore,
      estimatedPotentialScore: previousScore,
    };
  }

  // ---- 1. Time management analysis ----
  const timedAnswers = answers.filter(a => a.time_spent_seconds !== null && a.time_spent_seconds !== undefined);
  const avgTime = timedAnswers.length > 0
    ? timedAnswers.reduce((s, a) => s + (a.time_spent_seconds ?? 0), 0) / timedAnswers.length
    : 60;
  const rushers = timedAnswers.filter(a => !a.is_correct && (a.time_spent_seconds ?? 60) < 15);
  const slow = timedAnswers.filter(a => !a.is_correct && (a.time_spent_seconds ?? 60) > 180);
  const skipped = answers.filter(a => a.was_skipped);
  const timeMgmtBad = rushers.length + slow.length + skipped.length;
  const timeMgmtScore = Math.max(0, 100 - Math.round((timeMgmtBad / Math.max(total, 1)) * 200));

  // ---- 2. Careless mistake analysis ----
  // Changed answers that became wrong, or very fast wrong answers on easy questions
  const changedAndWrong = answers.filter(a => a.was_changed && !a.is_correct);
  const fastAndWrong = timedAnswers.filter(a =>
    !a.is_correct &&
    (a.time_spent_seconds ?? 60) < 30 &&
    (a.difficulty === "easy" || a.difficulty === "medium")
  );
  const carelessCount = changedAndWrong.length + fastAndWrong.length;
  const carelessScore = Math.max(0, 100 - Math.round((carelessCount / Math.max(total * 0.3, 1)) * 100));

  // ---- 3. Per-category skill analysis ----
  const categoryStats: Record<DNACategory, { correct: number; total: number }> = {
    knowledge_gaps:  { correct: 0, total: 0 },
    careless:        { correct: 0, total: 0 },
    time_mgmt:       { correct: 0, total: 0 },
    vocab:           { correct: 0, total: 0 },
    reading_comp:    { correct: 0, total: 0 },
    advanced_math:   { correct: 0, total: 0 },
    geometry:        { correct: 0, total: 0 },
    problem_solving: { correct: 0, total: 0 },
  };

  answers.forEach(a => {
    if (!a.skill) return;
    const cat = SKILL_TO_CATEGORY[a.skill];
    if (!cat) return;
    categoryStats[cat].total++;
    if (a.is_correct) categoryStats[cat].correct++;
  });

  // ---- 4. Compute scores and points lost ----
  const scores: Record<DNACategory, number> = {} as any;
  const pointsLost: Record<DNACategory, number> = {} as any;

  // Override with computed values
  scores.time_mgmt = timeMgmtScore;
  scores.careless = carelessScore;

  const categories: DNACategory[] = [
    "knowledge_gaps", "vocab", "reading_comp",
    "advanced_math", "geometry", "problem_solving"
  ];

  for (const cat of categories) {
    const { correct: c, total: t } = categoryStats[cat];
    if (t < 3) {
      scores[cat] = 80; // not enough data — assume OK
      pointsLost[cat] = 0;
    } else {
      const pct = c / t;
      scores[cat] = Math.round(pct * 100);
      // Points lost = (1 - accuracy) × max_loss × confidence_factor
      const confidenceFactor = Math.min(1, t / 15); // more data = more confident
      pointsLost[cat] = Math.round((1 - pct) * CATEGORY_MAX_LOSS[cat] * confidenceFactor);
    }
  }

  // Time mgmt and careless points lost
  pointsLost.time_mgmt = Math.round((timeMgmtBad / Math.max(total, 1)) * CATEGORY_MAX_LOSS.time_mgmt);
  pointsLost.careless = Math.round((carelessCount / Math.max(total * 0.3, 1)) * CATEGORY_MAX_LOSS.careless);

  // ---- 5. Weekly trend ----
  let weeklyTrend = 0;
  if (weeklyAnswers && weeklyAnswers.length >= 5) {
    const weeklyCorrect = weeklyAnswers.filter(a => a.is_correct).length;
    const weeklyPct = weeklyCorrect / weeklyAnswers.length;
    const overallPct = correct / total;
    weeklyTrend = Math.round((weeklyPct - overallPct) * 100);
  }

  // ---- 6. Confidence score ----
  // More answers = more confident in the diagnosis
  const overallConfidence = Math.min(95, Math.round(
    (Math.log(total + 1) / Math.log(100)) * 100
  ));

  // ---- 7. Build weakness objects ----
  const allCategories = Object.keys(DNA_META) as DNACategory[];
  const weaknesses: DNAWeakness[] = allCategories
    .filter(cat => pointsLost[cat] > 0 || scores[cat] < 75)
    .map(cat => {
      const meta = DNA_META[cat];
      const loss = pointsLost[cat];
      const score = scores[cat];
      const sessionsNeeded = Math.max(1, Math.ceil(loss / 15));

      const evidence = buildEvidence(cat, categoryStats[cat], {
        rushers: rushers.length, slow: slow.length, skipped: skipped.length,
        changedAndWrong: changedAndWrong.length, fastAndWrong: fastAndWrong.length,
        total, avgTime,
      });

      const recommendation = buildRecommendation(cat, loss, sessionsNeeded, score);

      return {
        category: cat,
        label: meta.label,
        icon: meta.icon,
        score,
        pointsLost: loss,
        confidence: Math.min(95, Math.round(overallConfidence * (categoryStats[cat]?.total ?? 0) / Math.max(total / 5, 1))),
        recommendation,
        sessionsNeeded,
        evidence,
      };
    })
    .sort((a, b) => b.pointsLost - a.pointsLost)
    .slice(0, 5);

  // ---- 8. Score estimation ----
  const totalLoss = Object.values(pointsLost).reduce((s, v) => s + v, 0);
  const estimatedCurrentScore = previousScore;
  const estimatedPotentialScore = previousScore
    ? Math.min(1600, previousScore + Math.round(totalLoss * 0.7))
    : null;

  return {
    scores,
    pointsLost,
    overallConfidence,
    weeklyTrend,
    totalAnswers: total,
    totalCorrect: correct,
    topWeaknesses: weaknesses,
    biggestWin: weaknesses[0] ?? null,
    estimatedCurrentScore,
    estimatedPotentialScore,
  };
}

function buildEvidence(
  cat: DNACategory,
  stats: { correct: number; total: number } | undefined,
  extra: {
    rushers: number; slow: number; skipped: number;
    changedAndWrong: number; fastAndWrong: number;
    total: number; avgTime: number;
  }
): string {
  const s = stats ?? { correct: 0, total: 0 };
  switch (cat) {
    case "time_mgmt":
      return `${extra.rushers} rushed wrong answers (<15s), ${extra.slow} slow wrong answers (>3min), ${extra.skipped} skipped`;
    case "careless":
      return `${extra.changedAndWrong} changed answers that became wrong, ${extra.fastAndWrong} fast wrong answers on easy questions`;
    case "knowledge_gaps":
    case "vocab":
    case "reading_comp":
    case "advanced_math":
    case "geometry":
    case "problem_solving":
      if (s.total < 3) return "Not enough data yet";
      return `${s.correct}/${s.total} correct (${Math.round(s.correct / s.total * 100)}% accuracy)`;
    default:
      return "";
  }
}

function buildRecommendation(
  cat: DNACategory,
  loss: number,
  sessions: number,
  score: number
): string {
  const meta = DNA_META[cat];
  if (loss < 5) return `${meta.label} is not a major concern right now.`;

  const templates: Record<DNACategory, string> = {
    knowledge_gaps:   `${meta.label} costs ~${loss} pts. Do ${sessions} targeted concept sessions this week — focus on understanding, not speed.`,
    careless:         `${meta.label} costs ~${loss} pts. Slow down by 10 seconds per question. Check your work before moving on.`,
    time_mgmt:        `${meta.label} costs ~${loss} pts. Practice ${sessions} timed drills. Target ≤90 seconds per R&W question, ≤2 minutes for Math.`,
    vocab:            `${meta.label} costs ~${loss} pts. Review ${sessions * 20} vocabulary words this week. Use spaced repetition daily.`,
    reading_comp:     `${meta.label} costs ~${loss} pts. Do ${sessions} passage-based R&W drills. Read the passage before looking at the question.`,
    advanced_math:    `${meta.label} costs ~${loss} pts. Do ${sessions} Advanced Math drills. Focus on quadratics, systems, and function notation.`,
    geometry:         `${meta.label} costs ~${loss} pts. Do ${sessions} Geometry drills. Memorize key formulas — triangles, circles, trig ratios.`,
    problem_solving:  `${meta.label} costs ~${loss} pts. Do ${sessions} Data Analysis drills. Practice percentage, ratio, and probability problems.`,
  };
  return templates[cat];
}
