// ================================================================
// SATPeaK — AI-Powered Adaptive Study Planner Engine
// Behaves like a personal SAT coach, not a static timetable.
// ================================================================

export type SkillStat = {
  skill: string;
  label: string;
  section: "reading_writing" | "math";
  pct: number;          // accuracy 0-100
  total: number;        // attempts
  trend?: number;       // recent delta vs overall (positive = improving)
  recentPct?: number;   // last 10 attempts accuracy
};

export type DailyTask = {
  id: string;
  title: string;
  subtitle: string;
  why: string;           // coach explanation
  icon: string;
  href: string;
  duration: number;      // minutes
  priority: "critical" | "high" | "medium" | "low";
  type: "drill" | "vocab" | "full_test" | "review" | "diagnostic" | "light";
  skillId?: string;
};

export type WeeklyGoal = {
  label: string;
  target: string;
  icon: string;
};

export type Milestone = {
  week: number;
  label: string;
  target: string;
};

export type AdaptivePlan = {
  // Context
  phase: string;
  phaseColor: string;
  headline: string;
  coachMessage: string;

  // Score projection
  currentEstimate: number | null;
  targetScore: number | null;
  scoreGap: number | null;
  pointsPerWeekNeeded: number | null;
  daysRemaining: number | null;
  progressPct: number;   // 0-100 toward target

  // Today
  dailyTasks: DailyTask[];
  totalMinutes: number;

  // Skill breakdown
  criticalSkills: SkillStat[];   // accuracy < 50%
  weakSkills: SkillStat[];       // accuracy 50-70%
  strongSkills: SkillStat[];     // accuracy > 80%
  improvingSkills: SkillStat[];  // positive trend

  // Bigger picture
  weeklyGoals: WeeklyGoal[];
  milestones: Milestone[];
  fullTestSchedule: string[];

  // Meta
  planVersion: number;  // bumps after each test so UI can show "updated"
};

// ---- SAT Score estimation ----------------------------------------
// Rough linear model: each skill weighted by College Board emphasis
const SKILL_WEIGHTS: Record<string, number> = {
  // R&W (800 pts max, ~4 questions each skill)
  words_in_context: 0.12, central_ideas: 0.10, command_of_evidence: 0.10,
  inferences: 0.08, text_structure: 0.08, cross_text: 0.06,
  rhetorical_synthesis: 0.08, transitions: 0.08, boundaries: 0.12, form_structure_sense: 0.08,
  // Math (800 pts max)
  linear_equations_one: 0.12, linear_equations_two: 0.08, linear_functions: 0.08,
  systems_linear: 0.06, linear_inequalities: 0.06, equivalent_expressions: 0.08,
  nonlinear_equations: 0.10, nonlinear_functions: 0.08, ratios_rates_proportions: 0.07,
  percentages: 0.06, one_variable_data: 0.05, two_variable_data: 0.05,
  probability: 0.04, inference_stats: 0.04, evaluating_claims: 0.04,
  area_volume: 0.06, lines_angles_triangles: 0.06, right_triangles_trig: 0.06, circles: 0.05,
};

function estimateScore(
  skillStats: SkillStat[],
  previousScore: number | null
): number | null {
  if (skillStats.length < 3) return previousScore;
  const rwSkills = skillStats.filter(s => s.section === "reading_writing" && s.total >= 3);
  const mathSkills = skillStats.filter(s => s.section === "math" && s.total >= 3);
  if (rwSkills.length < 2 && mathSkills.length < 2) return previousScore;

  const calcSection = (skills: SkillStat[]) => {
    if (skills.length === 0) return null;
    let weightedSum = 0; let totalWeight = 0;
    skills.forEach(s => {
      const w = SKILL_WEIGHTS[s.skill] ?? 0.07;
      weightedSum += (s.pct / 100) * w;
      totalWeight += w;
    });
    const normalised = totalWeight > 0 ? weightedSum / totalWeight : 0.5;
    return Math.round(200 + normalised * 600);
  };

  const rwScore = calcSection(rwSkills);
  const mathScore = calcSection(mathSkills);

  if (rwScore && mathScore) return Math.min(1600, rwScore + mathScore);
  if (rwScore) return previousScore ? Math.round((previousScore + rwScore * 2) / 2) : null;
  if (mathScore) return previousScore ? Math.round((previousScore + mathScore * 2) / 2) : null;
  return previousScore;
}

// ---- Phase determination ----------------------------------------
function getPhase(days: number | null): { phase: string; color: string } {
  if (days === null) return { phase: "Open prep", color: "blue" };
  if (days > 90) return { phase: "Foundation", color: "green" };
  if (days > 60) return { phase: "Foundation (60+ days)", color: "green" };
  if (days > 30) return { phase: "Build & Sharpen", color: "yellow" };
  if (days > 14) return { phase: "Acceleration", color: "orange" };
  if (days > 7) return { phase: "Final Push", color: "red" };
  if (days > 1) return { phase: "Exam Week", color: "red" };
  if (days === 1) return { phase: "Tomorrow!", color: "red" };
  return { phase: "Exam Day", color: "red" };
}

// ---- Time allocation ----------------------------------------
function allocateTime(
  days: number | null,
  skillStats: SkillStat[],
  vocabDue: number,
  dailyMinutes: number
): { drills: number; vocab: number; fullTest: number; review: number } {
  let drills = 0.5, vocab = 0.2, fullTest = 0, review = 0.3;

  // Exam week: more tests, less drilling
  if (days !== null && days <= 14) {
    drills = 0.3; vocab = 0.1; fullTest = 0.4; review = 0.2;
  } else if (days !== null && days <= 30) {
    drills = 0.4; fullTest = 0.3; vocab = 0.15; review = 0.15;
  }

  // Heavy vocab backlog
  if (vocabDue > 20) { vocab = Math.min(vocab + 0.1, 0.3); drills -= 0.1; }

  // Many critical skills
  const critical = skillStats.filter(s => s.pct < 50 && s.total >= 3);
  if (critical.length >= 3) { drills = Math.min(drills + 0.1, 0.7); review -= 0.05; fullTest -= 0.05; }

  const total = dailyMinutes;
  return {
    drills: Math.round(total * drills),
    vocab: Math.round(total * Math.max(vocab, vocabDue > 0 ? 0.1 : 0)),
    fullTest: Math.round(total * fullTest),
    review: Math.round(total * review),
  };
}

// ---- Main export ----------------------------------------
export function generateAdaptivePlan(opts: {
  days: number | null;
  diagnosticDone: boolean;
  skillStats: SkillStat[];
  vocabDue: number;
  streak: number;
  totalAnswered: number;
  previousScore: number | null;
  targetScore: number | null;
  sessionCount: number;    // total completed sessions (bumps planVersion)
  dailyMinutes?: number;   // user preference (default 60)
}): AdaptivePlan {
  const {
    days, diagnosticDone, skillStats, vocabDue,
    totalAnswered, previousScore, targetScore, sessionCount,
  } = opts;
  const dailyMinutes = opts.dailyMinutes ?? 60;

  const { phase, color: phaseColor } = getPhase(days);
  const currentEstimate = estimateScore(skillStats, previousScore);
  const scoreGap = (targetScore && currentEstimate) ? targetScore - currentEstimate : null;
  const pointsPerWeekNeeded = (scoreGap && days && days > 0)
    ? Math.round((scoreGap / days) * 7 * 10) / 10 : null;

  // Progress toward target
  const progressPct = (currentEstimate && targetScore && previousScore)
    ? Math.min(100, Math.max(0, Math.round(
        ((currentEstimate - previousScore) / Math.max(1, targetScore - previousScore)) * 100
      )))
    : 0;

  // Skill classification
  const meaningful = skillStats.filter(s => s.total >= 3);
  const criticalSkills = meaningful.filter(s => s.pct < 50).sort((a, b) => a.pct - b.pct);
  const weakSkills = meaningful.filter(s => s.pct >= 50 && s.pct < 70).sort((a, b) => a.pct - b.pct);
  const strongSkills = meaningful.filter(s => s.pct >= 80).sort((a, b) => b.pct - a.pct);
  const improvingSkills = meaningful.filter(s => (s.trend ?? 0) > 5);

  // ---- No diagnostic ----
  if (!diagnosticDone) {
    return {
      phase: "Day 1", phaseColor: "blue",
      headline: "Start with your diagnostic test — everything follows from this.",
      coachMessage: "I need to see how you perform across all skills before I can build your personal roadmap. The diagnostic takes 30 minutes and tests both R&W and Math at a medium difficulty level. After it's done, I'll have a full picture of exactly where to focus.",
      currentEstimate: previousScore, targetScore, scoreGap,
      pointsPerWeekNeeded: null, daysRemaining: days, progressPct: 0,
      dailyTasks: [{
        id: "diagnostic", title: "Take the diagnostic test",
        subtitle: "30 min · 15 R&W + 15 Math questions",
        why: "Without a diagnostic, I'm guessing. This one-time test maps your skill shape across all 14 areas and lets me build a plan that's actually yours — not a generic template.",
        icon: "📋", href: "/app/diagnostic", duration: 30,
        priority: "critical", type: "diagnostic",
      }],
      totalMinutes: 30, criticalSkills: [], weakSkills: [], strongSkills: [], improvingSkills: [],
      weeklyGoals: [{ label: "Complete diagnostic", target: "This week", icon: "🎯" }],
      milestones: [], fullTestSchedule: [], planVersion: 0,
    };
  }

  // ---- Build daily tasks ----
  const tasks: DailyTask[] = [];
  const time = allocateTime(days, skillStats, vocabDue, dailyMinutes);

  // 1. Vocab (if due)
  if (vocabDue > 0) {
    const mins = Math.min(time.vocab, 15);
    tasks.push({
      id: "vocab",
      title: "Vocabulary review",
      subtitle: `${vocabDue} word${vocabDue > 1 ? "s" : ""} due for spaced repetition`,
      why: `Spaced repetition shows these ${vocabDue} words at the exact moment your brain is about to forget them — reviewing now locks them in permanently. Vocabulary accounts for ~12% of your R&W score.`,
      icon: "📚", href: "/app/vocabulary/review",
      duration: mins, priority: "high", type: "vocab",
    });
  }

  // 2. Critical skill drills (accuracy < 50%)
  const topCritical = criticalSkills.slice(0, 2);
  topCritical.forEach((skill, i) => {
    const isRW = skill.section === "reading_writing";
    const mins = Math.round((i === 0 ? 0.6 : 0.4) * Math.min(time.drills, 40));
    const declining = (skill.trend ?? 0) < -5;
    tasks.push({
      id: `critical-${skill.skill}`,
      title: `Drill: ${skill.label}`,
      subtitle: `${skill.pct}% accuracy${declining ? " · declining ↓" : " · needs work"}`,
      why: declining
        ? `Your accuracy on ${skill.label} has dropped recently — this is a red flag. At ${skill.pct}%, you're losing easy points. Concentrated work here is the highest-leverage move you can make today.`
        : `At ${skill.pct}%, ${skill.label} is your biggest drag on score. Fixing a skill from 45% to 70% adds approximately ${isRW ? "40-60" : "40-60"} points to your total. This is priority #1.`,
      icon: isRW ? "📖" : "🧮",
      href: `/app/drills?section=${skill.section}&skill=${encodeURIComponent(skill.skill)}`,
      duration: Math.max(10, mins), priority: "critical", type: "drill", skillId: skill.skill,
    });
  });

  // 3. Weak skills (50-70%) if no critical OR after critical
  if (criticalSkills.length === 0 && weakSkills.length > 0) {
    const skill = weakSkills[0];
    tasks.push({
      id: `weak-${skill.skill}`,
      title: `Drill: ${skill.label}`,
      subtitle: `${skill.pct}% accuracy · room to grow`,
      why: `You're at ${skill.pct}% on ${skill.label} — not terrible, but not reliable. Getting this to 80%+ would meaningfully lift your score. You're close enough that a focused session today should move the needle.`,
      icon: skill.section === "math" ? "🧮" : "📖",
      href: `/app/drills?section=${skill.section}&skill=${encodeURIComponent(skill.skill)}`,
      duration: Math.min(20, time.drills), priority: "high", type: "drill", skillId: skill.skill,
    });
  }

  // 4. Full test (exam week or scheduled)
  const testDue = days !== null && (days <= 14 || (days > 14 && sessionCount % 7 === 0 && sessionCount > 0));
  if (testDue && time.fullTest >= 30) {
    tasks.push({
      id: "full-test",
      title: "Full-length mock exam",
      subtitle: days !== null && days <= 14 ? "Exam week stamina practice" : "Scheduled test day",
      why: days !== null && days <= 14
        ? "With the exam close, the most valuable thing is running the full test-day simulation. This builds stamina, pacing instinct, and reduces anxiety on the real day."
        : "You've had a full week of targeted drilling. A mock exam now consolidates everything you've learned, identifies new gaps, and updates your study plan automatically.",
      icon: "⏱️", href: "/app/full-test",
      duration: Math.min(time.fullTest, 120), priority: days !== null && days <= 7 ? "critical" : "high",
      type: "full_test",
    });
  }

  // 5. Review past mistakes
  if (totalAnswered > 20 && time.review >= 10) {
    const improvingThisSession = improvingSkills.length > 0;
    tasks.push({
      id: "review",
      title: "Review mistake queue",
      subtitle: "Go through questions you got wrong",
      why: improvingThisSession
        ? `You're improving on ${improvingSkills[0]?.label ?? "several skills"} — reviewing your past mistakes in these areas cements the understanding you've built and prevents regression.`
        : "Error analysis is how experts learn. Re-reading questions you got wrong (and understanding exactly why) is more effective per minute than doing new questions.",
      icon: "🔄", href: "/app/review",
      duration: Math.min(time.review, 15), priority: "medium", type: "review",
    });
  }

  // 6. Exam-week special: light review, no new material
  if (days !== null && days <= 2) {
    tasks.length = 0; // clear all heavy tasks
    tasks.push({
      id: "light-review",
      title: days === 1 ? "Final light review" : "Exam day — no studying",
      subtitle: days === 1 ? "30 min max · familiar topics only" : "Rest, eat well, sleep early",
      why: days === 1
        ? "The science is clear: cramming the night before degrades performance. Review 2-3 concepts you feel shaky on, then stop. Your brain needs rest to consolidate everything you've learned."
        : "You've done the work. Today is about being in peak physical and mental condition. Stress lowers performance more than any last-minute study session can help.",
      icon: days === 1 ? "🧘" : "🌙", href: "/app/review",
      duration: days === 1 ? 30 : 0, priority: "low", type: "light",
    });
  }

  // ---- Headline and coach message ----
  let headline = "";
  let coachMessage = "";

  if (days !== null && days <= 2) {
    headline = days === 1 ? "Rest and a light review. You're ready." : "It's exam day. You've prepared for this.";
    coachMessage = "Trust your preparation. The work is done. Focus on sleep, a good breakfast, and arriving early. Everything you need is already in your head.";
  } else if (criticalSkills.length >= 3) {
    headline = `${criticalSkills.length} skills below 50% — we need to fix these first.`;
    coachMessage = `I've identified ${criticalSkills.length} critical weaknesses dragging your score down: ${criticalSkills.slice(0, 3).map(s => s.label).join(", ")}. Each one is an opportunity — students typically gain 30-60 points by fixing a single critical weakness. Today's plan attacks the two biggest ones.`;
  } else if (criticalSkills.length > 0) {
    headline = `${criticalSkills[0].label} is holding you back — today we fix it.`;
    coachMessage = `Your weakest skill is ${criticalSkills[0].label} at ${criticalSkills[0].pct}% accuracy. ${(criticalSkills[0].trend ?? 0) < 0 ? "It's been declining recently, which means we need to change approach." : "The good news: you have plenty of room to improve, and I've seen students turn around similar numbers in 1-2 focused sessions."} Today's tasks are ordered by highest score impact.`;
  } else if (improvingSkills.length > 0) {
    headline = `You're improving on ${improvingSkills[0].label} — let's keep building.`;
    coachMessage = `Great momentum on ${improvingSkills.slice(0, 2).map(s => s.label).join(" and ")}. When a skill improves, I reduce focus on it and shift time to your next priority. Today's plan reflects that — we're moving resources toward your remaining weak spots.`;
  } else if (days !== null && days <= 14) {
    headline = "Final stretch — simulate, review, don't learn new material.";
    coachMessage = `${days} days out, the game changes. No new skills — only reinforcement and simulation. Your plan is now weighted toward full tests and reviewing your established weak spots. I've scheduled mock exams at a pace that builds stamina without burning you out.`;
  } else {
    headline = strongSkills.length > 3 ? "Strong foundation — time to push toward mastery." : "Build the habit, map the weaknesses.";
    coachMessage = strongSkills.length > 3
      ? `You have ${strongSkills.length} strong skills. The gap between a good score and a great score is usually 2-3 weak areas. I've focused today on your softest spots because that's where the remaining points are hiding.`
      : `You're still early in your prep. The most important thing right now is drilling consistently enough that I can map your real skill level. A few sessions in, I'll have enough data to give you hyper-specific guidance.`;
  }

  // ---- Weekly goals ----
  const weeklyGoals: WeeklyGoal[] = [];
  if (criticalSkills.length > 0) {
    weeklyGoals.push({ label: `Lift ${criticalSkills[0].label} above 60%`, target: "This week", icon: "📈" });
  }
  if (vocabDue > 0 || totalAnswered < 50) {
    weeklyGoals.push({ label: "Complete daily vocabulary reviews", target: "Every day", icon: "📚" });
  }
  if (days !== null && days <= 30) {
    weeklyGoals.push({ label: "Run 2 full mock exams", target: "This week", icon: "⏱️" });
  }
  weeklyGoals.push({ label: "Maintain practice streak", target: `${opts.streak} days → ${opts.streak + 7}`, icon: "🔥" });

  // ---- Milestones ----
  const milestones: Milestone[] = [];
  if (days && days > 28) {
    milestones.push({ week: 1, label: "Diagnostic + skill baseline", target: "All 14 skills attempted" });
    milestones.push({ week: 2, label: "First mock exam", target: "Establish score baseline" });
    milestones.push({ week: 4, label: "Critical skills resolved", target: "All skills above 55%" });
  }
  if (days && days > 56) {
    milestones.push({ week: 6, label: "Weak skills strengthened", target: "All skills above 65%" });
    milestones.push({ week: 8, label: "Mock exam target hit", target: `Score ${targetScore ? targetScore - 50 : "near target"}+` });
  }

  // ---- Full test schedule ----
  const fullTestSchedule: string[] = [];
  if (days && days > 14) {
    const testsNeeded = Math.min(6, Math.floor(days / 14));
    for (let i = 1; i <= testsNeeded; i++) {
      const daysOut = days - i * Math.floor(days / (testsNeeded + 1));
      if (daysOut > 0) fullTestSchedule.push(`${daysOut} days before exam`);
    }
  }

  const totalMinutes = tasks.reduce((sum, t) => sum + t.duration, 0);

  return {
    phase, phaseColor,
    headline, coachMessage,
    currentEstimate, targetScore, scoreGap,
    pointsPerWeekNeeded, daysRemaining: days, progressPct,
    dailyTasks: tasks.slice(0, 6),
    totalMinutes,
    criticalSkills, weakSkills, strongSkills, improvingSkills,
    weeklyGoals, milestones, fullTestSchedule,
    planVersion: sessionCount,
  };
}

// Keep old export for any other files that use it
export { generateAdaptivePlan as generateStudyPlan };
