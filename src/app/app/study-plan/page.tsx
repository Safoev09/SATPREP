import Link from "next/link";
import { requireStudent } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase-server";
import { daysUntil } from "@/lib/exam-dates";
import { getSkillLabel } from "@/lib/skills";
import { generateStudyPlan, type SkillStat } from "@/lib/study-plan";

export default async function StudyPlanPage() {
  const { profile } = await requireStudent();
  const supabase = createClient();

  const { data: answers } = await supabase
    .from("answers")
    .select("is_correct, questions(skill, section)")
    .eq("user_id", profile.id);

  const bySkill: Record<string, { correct: number; total: number; section: string }> = {};
  (answers ?? []).forEach((a: any) => {
    const skill = a.questions?.skill;
    const section = a.questions?.section;
    if (!skill) return;
    if (!bySkill[skill]) bySkill[skill] = { correct: 0, total: 0, section };
    bySkill[skill].total++;
    if (a.is_correct) bySkill[skill].correct++;
  });

  const skillStats: SkillStat[] = Object.entries(bySkill).map(([skill, v]) => ({
    skill,
    label: getSkillLabel(skill),
    section: v.section as "reading_writing" | "math",
    pct: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
    total: v.total,
  }));

  const nowIso = new Date().toISOString();
  const { count: vocabDue } = await supabase
    .from("user_vocab")
    .select("*", { count: "exact", head: true })
    .eq("user_id", profile.id)
    .lte("next_review_at", nowIso);

  const days = profile.target_exam_date ? daysUntil(profile.target_exam_date) : null;
  const plan = generateStudyPlan({
    days,
    diagnosticDone: profile.diagnostic_completed,
    skillStats,
    vocabDue: vocabDue ?? 0,
    streak: profile.current_streak ?? 0,
    totalAnswered: answers?.length ?? 0,
  });

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="text-xs text-accent uppercase tracking-[0.15em] font-semibold mb-1">
          Your roadmap
        </div>
        <h1 className="font-display text-4xl font-semibold text-coffee-900">
          Study Plan
        </h1>
        <p className="text-coffee-600 mt-1.5">
          {plan.headline}
        </p>
      </div>

      {/* Phase context */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-cream-50 border border-coffee-700/10 rounded-2xl p-5">
          <div className="text-xs text-coffee-500 uppercase tracking-wider mb-1">
            Phase
          </div>
          <div className="font-display text-lg font-semibold text-coffee-900">
            {plan.phase}
          </div>
        </div>
        <div className="bg-cream-50 border border-coffee-700/10 rounded-2xl p-5">
          <div className="text-xs text-coffee-500 uppercase tracking-wider mb-1">
            Days to exam
          </div>
          <div className="font-display text-2xl font-semibold text-coffee-900">
            {days ?? "—"}
          </div>
        </div>
        <div className="bg-cream-50 border border-coffee-700/10 rounded-2xl p-5">
          <div className="text-xs text-coffee-500 uppercase tracking-wider mb-1">
            Today's goal
          </div>
          <div className="font-display text-lg font-semibold text-coffee-900">
            {plan.tasks.length} tasks
          </div>
        </div>
      </div>

      {/* Today's tasks */}
      <div className="mb-8">
        <h2 className="font-display text-xl font-semibold text-coffee-900 mb-4">
          Today's tasks
        </h2>
        <div className="space-y-3">
          {plan.tasks.map((t, i) => (
            <Link
              key={i}
              href={t.href}
              className="group flex items-center gap-4 bg-cream-50 border border-coffee-700/10 rounded-2xl p-5 hover:scale-[1.005] hover:border-accent/40 transition-all"
            >
              <div className="text-xs font-semibold text-coffee-500 w-6">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="text-3xl">{t.icon}</div>
              <div className="flex-1">
                <div className="font-medium text-coffee-900">
                  {t.title}
                </div>
                <div className="text-sm text-coffee-600 mt-0.5">
                  {t.subtitle}
                </div>
              </div>
              <div className="text-xs text-coffee-500 bg-cream-100 px-3 py-1 rounded-full whitespace-nowrap">
                {t.duration}
              </div>
              <div className="text-coffee-500 group-hover:text-accent group-hover:translate-x-0.5 transition">
                →
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Why this plan */}
      <div className="glass rounded-2xl p-5">
        <div className="text-xs text-accent uppercase tracking-wider font-semibold mb-2">
          Why this plan
        </div>
        <p className="text-sm text-coffee-700 leading-relaxed">
          {plan.rationale}
        </p>
      </div>
    </div>
  );
}
