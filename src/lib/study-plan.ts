// Rule-based study plan generator.
// Builds a daily plan based on real data: weak skills, days remaining, vocab due, etc.

export type SkillStat = {
  skill: string;
  label: string;
  section: "reading_writing" | "math";
  pct: number;
  total: number;
};

type Task = {
  title: string;
  subtitle: string;
  icon: string;
  href: string;
  duration: string;
};

type Plan = {
  phase: string;
  headline: string;
  rationale: string;
  tasks: Task[];
};

export function generateStudyPlan(opts: {
  days: number | null;
  diagnosticDone: boolean;
  skillStats: SkillStat[];
  vocabDue: number;
  streak: number;
  totalAnswered: number;
}): Plan {
  const { days, diagnosticDone, skillStats, vocabDue, totalAnswered } = opts;

  // ---- Determine phase ----
  let phase: string;
  if (!diagnosticDone) phase = "Day 1 — Diagnostic";
  else if (days === null) phase = "Open prep";
  else if (days > 60) phase = "Foundation (60+ days)";
  else if (days > 21) phase = "Build & sharpen (3-9 weeks)";
  else if (days > 7) phase = "Final push (1-3 weeks)";
  else if (days > 1) phase = "Exam week";
  else if (days === 1) phase = "Tomorrow!";
  else if (days === 0) phase = "Exam day";
  else phase = "After the exam";

  // ---- No diagnostic yet → just point them to it ----
  if (!diagnosticDone) {
    return {
      phase,
      headline: "Start with your diagnostic — it sets up everything else.",
      rationale:
        "Without a diagnostic, the plan can't pinpoint your weak areas. After 30 minutes of testing you'll have a personalized roadmap.",
      tasks: [
        {
          title: "Take the diagnostic",
          subtitle: "30 minutes · 15 R&W + 15 Math",
          icon: "📋",
          href: "/app/diagnostic",
          duration: "30 min",
        },
      ],
    };
  }

  // ---- Build task list ----
  const tasks: Task[] = [];

  // Find weakest skills (need >= 3 attempts for it to be meaningful)
  const meaningful = skillStats.filter((s) => s.total >= 3).sort((a, b) => a.pct - b.pct);
  const weakest = meaningful[0];
  const secondWeakest = meaningful[1];

  // Vocab review if any due
  if (vocabDue > 0) {
    tasks.push({
      title: "Vocabulary review",
      subtitle: `${vocabDue} words due for spaced repetition`,
      icon: "📚",
      href: "/app/vocabulary/review",
      duration: `${Math.max(5, Math.min(15, vocabDue))} min`,
    });
  }

  // Weak skill drill
  if (weakest && weakest.pct < 80) {
    const href = weakest.section === "math" ? "/app/math/drills" : "/app/rw/drills";
    tasks.push({
      title: `Drill: ${weakest.label}`,
      subtitle: `Your weakest area at ${weakest.pct}% accuracy`,
      icon: weakest.section === "math" ? "🧮" : "📖",
      href: `${href}?skill=${encodeURIComponent(weakest.skill)}`,
      duration: "20 min",
    });
  } else if (totalAnswered < 10) {
    // Very early — just do a starter drill
    tasks.push({
      title: "R&W warm-up drill",
      subtitle: "Build the habit — pick any skill",
      icon: "📖",
      href: "/app/rw/drills",
      duration: "15 min",
    });
  }

  // Second weak skill OR cross-train
  if (secondWeakest && secondWeakest.pct < 80 && tasks.length < 3) {
    const href = secondWeakest.section === "math" ? "/app/math/drills" : "/app/rw/drills";
    tasks.push({
      title: `Drill: ${secondWeakest.label}`,
      subtitle: `Next weakest at ${secondWeakest.pct}%`,
      icon: secondWeakest.section === "math" ? "🧮" : "📖",
      href: `${href}?skill=${encodeURIComponent(secondWeakest.skill)}`,
      duration: "15 min",
    });
  }

  // Phase-specific addition
  if (days !== null && days <= 14 && days > 1) {
    tasks.push({
      title: "Timed mock exam",
      subtitle: "Build stamina under real conditions",
      icon: "⏱️",
      href: "/app/full-test",
      duration: "2 h",
    });
  } else if (days !== null && days > 14 && tasks.length < 4) {
    tasks.push({
      title: "Add new vocabulary",
      subtitle: "Pick a list or save words while reading",
      icon: "✨",
      href: "/app/vocabulary",
      duration: "10 min",
    });
  }

  // Always include a review step if there's review-queue content (we don't know — point there)
  if (tasks.length < 4) {
    tasks.push({
      title: "Review past mistakes",
      subtitle: "Go through questions you got wrong",
      icon: "🔄",
      href: "/app/review",
      duration: "10 min",
    });
  }

  // ---- Headline + rationale ----
  let headline: string;
  let rationale: string;

  if (days !== null && days <= 1) {
    headline = "Rest, eat well, sleep early. Light review only.";
    rationale =
      "Cramming the day before doesn't help and adds stress. Trust your preparation. Light review of known weak spots is fine; no full tests.";
  } else if (days !== null && days <= 7) {
    headline = "Final push — timed practice, light drilling, no new material.";
    rationale =
      "With only a week left, you'll gain more from timed mocks and reinforcing weak spots than from new content. Focus on test stamina.";
  } else if (weakest && weakest.pct < 60) {
    headline = `${weakest.label} is dragging you down — let's fix it.`;
    rationale = `You're at ${weakest.pct}% on ${weakest.label}, well below your other skills. Concentrated drilling here will move your score more than anything else right now.`;
  } else if (weakest) {
    headline = "You're doing well — let's keep sharpening.";
    rationale = `Your skills are reasonably even. Today focuses on your softest spot (${weakest.label} at ${weakest.pct}%) plus general practice to stay sharp.`;
  } else {
    headline = "Build a steady practice habit.";
    rationale =
      "You haven't practised enough yet for a tailored plan. A few drills today will let SATPeaK see your patterns and pick the smartest focus tomorrow.";
  }

  return { phase, headline, rationale, tasks: tasks.slice(0, 5) };
}
