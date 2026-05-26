// Decide what a student should practise next, based on their real skill data.

export type SkillStat = {
  skill: string;
  label: string;
  section: "reading_writing" | "math";
  pct: number;
  total: number;
};

export type Recommendation = {
  headline: string;
  reason: string;
  ctaLabel: string;
  ctaHref: string;
  tone: "start" | "focus" | "improve" | "celebrate";
};

export function getRecommendation(
  skillStats: SkillStat[],
  diagnosticDone: boolean,
  totalAnswered: number
): Recommendation {
  // No practice yet → push the diagnostic
  if (!diagnosticDone && totalAnswered === 0) {
    return {
      headline: "Start with your diagnostic",
      reason:
        "A 30-minute diagnostic shows exactly where you stand and what to focus on first.",
      ctaLabel: "Take the diagnostic",
      ctaHref: "/app/diagnostic",
      tone: "start",
    };
  }

  // Practised a little but not much → encourage more drilling
  if (totalAnswered < 10) {
    return {
      headline: "Build a practice base",
      reason:
        "Do a few more drills so SATPrep can map your strengths and weak spots accurately.",
      ctaLabel: "Start a drill",
      ctaHref: "/app/rw/drills",
      tone: "start",
    };
  }

  // Find the weakest skill with a meaningful sample size
  const meaningful = skillStats.filter((s) => s.total >= 3);
  const pool = meaningful.length > 0 ? meaningful : skillStats;

  if (pool.length === 0) {
    return {
      headline: "Keep practising",
      reason: "Do a drill to start building your skill map.",
      ctaLabel: "Start a drill",
      ctaHref: "/app/rw/drills",
      tone: "start",
    };
  }

  const weakest = [...pool].sort((a, b) => a.pct - b.pct)[0];

  // Everything strong → celebrate + push a full test
  if (weakest.pct >= 80) {
    return {
      headline: "You're in great shape",
      reason:
        "Every tracked skill is above 80%. Take a full mock test to pressure-test under real conditions.",
      ctaLabel: "Take a full mock",
      ctaHref: "/app/full-test",
      tone: "celebrate",
    };
  }

  const drillHref =
    weakest.section === "math" ? "/app/math/drills" : "/app/rw/drills";

  // Weak skill found → focus recommendation
  if (weakest.pct < 50) {
    return {
      headline: `Focus on ${weakest.label}`,
      reason: `This is your weakest skill right now at ${weakest.pct}% accuracy. A focused drill here will move your score the most.`,
      ctaLabel: `Drill ${weakest.label}`,
      ctaHref: drillHref,
      tone: "focus",
    };
  }

  // Middling → improvement recommendation
  return {
    headline: `Sharpen ${weakest.label}`,
    reason: `You're at ${weakest.pct}% on this skill — close to solid. A bit more practice will push it into your strong zone.`,
    ctaLabel: `Drill ${weakest.label}`,
    ctaHref: drillHref,
    tone: "improve",
  };
}
