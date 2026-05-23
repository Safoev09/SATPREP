import { getSkillLabel, getSkillDomain } from "@/lib/skills";

export type DiagnosticAnswer = {
  question_id: number;
  skill: string;
  section: "reading_writing" | "math";
  difficulty: "easy" | "medium" | "hard";
  is_correct: boolean;
};

export type SkillResult = {
  skill: string;
  label: string;
  domain: string | null;
  correct: number;
  total: number;
  rating: "strong" | "okay" | "weak";
};

export type DiagnosticResult = {
  rwCorrect: number;
  rwTotal: number;
  mathCorrect: number;
  mathTotal: number;
  rwScore: number;        // 200-800
  mathScore: number;      // 200-800
  totalScore: number;     // 400-1600
  skillResults: SkillResult[];
  strengths: SkillResult[];
  weaknesses: SkillResult[];
};

// Convert a percentage-correct on a section into an estimated 200-800 score.
// This is an approximation for a short diagnostic, not an official conversion.
function sectionScore(correct: number, total: number): number {
  if (total === 0) return 200;
  const pct = correct / total;
  // Map 0% -> 200, 100% -> 800, smoothed slightly so middling scores land realistically
  const raw = 200 + pct * 600;
  // Round to nearest 10 like real SAT section scores
  return Math.round(raw / 10) * 10;
}

function rateSkill(correct: number, total: number): "strong" | "okay" | "weak" {
  if (total === 0) return "okay";
  const pct = correct / total;
  if (pct >= 0.75) return "strong";
  if (pct >= 0.5) return "okay";
  return "weak";
}

export function scoreDiagnostic(answers: DiagnosticAnswer[]): DiagnosticResult {
  const rw = answers.filter((a) => a.section === "reading_writing");
  const math = answers.filter((a) => a.section === "math");

  const rwCorrect = rw.filter((a) => a.is_correct).length;
  const mathCorrect = math.filter((a) => a.is_correct).length;

  const rwScore = sectionScore(rwCorrect, rw.length);
  const mathScore = sectionScore(mathCorrect, math.length);

  // Group by skill
  const bySkill: Record<string, { correct: number; total: number }> = {};
  answers.forEach((a) => {
    if (!bySkill[a.skill]) bySkill[a.skill] = { correct: 0, total: 0 };
    bySkill[a.skill].total++;
    if (a.is_correct) bySkill[a.skill].correct++;
  });

  const skillResults: SkillResult[] = Object.entries(bySkill).map(
    ([skill, { correct, total }]) => ({
      skill,
      label: getSkillLabel(skill),
      domain: getSkillDomain(skill),
      correct,
      total,
      rating: rateSkill(correct, total),
    })
  );

  // Sort: weakest first for the "focus here" list
  skillResults.sort((a, b) => a.correct / a.total - b.correct / b.total);

  const weaknesses = skillResults.filter((s) => s.rating === "weak");
  const strengths = skillResults.filter((s) => s.rating === "strong");

  return {
    rwCorrect,
    rwTotal: rw.length,
    mathCorrect,
    mathTotal: math.length,
    rwScore,
    mathScore,
    totalScore: rwScore + mathScore,
    skillResults,
    strengths,
    weaknesses,
  };
}
