"use client";

import Link from "next/link";
import { useState } from "react";
import type { AdaptivePlan, SkillStat, DailyTask } from "@/lib/study-plan";

type Props = {
  plan: AdaptivePlan;
  skillStats: SkillStat[];
  userName: string;
};

export default function StudyPlanView({ plan, skillStats, userName }: Props) {
  const [activeTab, setActiveTab] = useState<"today" | "skills" | "roadmap">("today");
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-cream-100">
      {/* ===== HERO HEADER ===== */}
      <div className="relative overflow-hidden bg-coffee-900 text-cream-50 px-8 py-10">
        <div className="absolute top-[-60%] right-[-10%] w-[36rem] h-[36rem] rounded-full bg-accent/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-40%] left-[5%] w-72 h-72 rounded-full bg-coffee-700/40 blur-3xl pointer-events-none" />
        <div className="max-w-5xl mx-auto relative">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-semibold uppercase tracking-[0.18em] px-2.5 py-1 rounded-full ${
                  plan.phaseColor === "red" ? "bg-red-500/20 text-red-300" :
                  plan.phaseColor === "orange" ? "bg-orange-500/20 text-orange-300" :
                  plan.phaseColor === "yellow" ? "bg-yellow-500/20 text-yellow-300" :
                  "bg-green-500/20 text-green-300"
                }`}>
                  {plan.phase}
                </span>
                {plan.planVersion > 0 && (
                  <span className="text-xs text-cream-200/60">
                    Updated after session #{plan.planVersion}
                  </span>
                )}
              </div>
              <h1 className="font-display text-3xl lg:text-4xl font-semibold leading-tight mb-2">
                {plan.headline}
              </h1>
              <p className="text-cream-200/80 text-sm leading-relaxed max-w-2xl">
                {plan.coachMessage}
              </p>
            </div>

            {/* Score gap meter */}
            {plan.currentEstimate && plan.targetScore && (
              <div className="bg-cream-50/10 backdrop-blur rounded-2xl p-5 min-w-[200px] shrink-0">
                <div className="text-xs text-cream-200/60 uppercase tracking-wider mb-3">Score target</div>
                <div className="flex items-end gap-2 mb-3">
                  <div>
                    <div className="text-xs text-cream-200/60 mb-0.5">Now</div>
                    <div className="font-display text-3xl font-semibold">{plan.currentEstimate}</div>
                  </div>
                  <div className="text-cream-200/40 text-xl mb-1">→</div>
                  <div>
                    <div className="text-xs text-cream-200/60 mb-0.5">Target</div>
                    <div className="font-display text-3xl font-semibold text-accent">{plan.targetScore}</div>
                  </div>
                </div>
                {plan.scoreGap !== null && plan.scoreGap > 0 && (
                  <>
                    <div className="h-1.5 bg-cream-50/10 rounded-full overflow-hidden mb-1.5">
                      <div
                        className="h-full bg-accent rounded-full transition-all duration-1000"
                        style={{ width: `${plan.progressPct}%` }}
                      />
                    </div>
                    <div className="text-xs text-cream-200/60">
                      {plan.scoreGap} pts to go
                      {plan.pointsPerWeekNeeded && ` · ${plan.pointsPerWeekNeeded} pts/week needed`}
                    </div>
                  </>
                )}
                {plan.scoreGap !== null && plan.scoreGap <= 0 && (
                  <div className="text-xs text-green-400 font-medium">🎉 Target reached!</div>
                )}
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
            {[
              { label: "Days to exam", value: plan.daysRemaining ?? "—", sub: plan.daysRemaining === 0 ? "Today!" : plan.daysRemaining === 1 ? "Tomorrow!" : "" },
              { label: "Today's tasks", value: plan.dailyTasks.length, sub: `${plan.totalMinutes} min` },
              { label: "Critical skills", value: plan.criticalSkills.length, sub: plan.criticalSkills.length === 0 ? "None 🎉" : "need work" },
              { label: "Improving", value: plan.improvingSkills.length, sub: plan.improvingSkills.length > 0 ? "skills trending up" : "keep going" },
            ].map((s) => (
              <div key={s.label} className="bg-cream-50/8 rounded-xl p-3.5">
                <div className="text-xs text-cream-200/50 uppercase tracking-wider mb-1">{s.label}</div>
                <div className="font-display text-2xl font-semibold">{s.value}</div>
                {s.sub && <div className="text-xs text-cream-200/50 mt-0.5">{s.sub}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== TABS ===== */}
      <div className="sticky top-0 z-20 bg-cream-100/95 backdrop-blur border-b border-coffee-700/10">
        <div className="max-w-5xl mx-auto px-8">
          <div className="flex gap-0">
            {(["today", "skills", "roadmap"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3.5 text-sm font-medium capitalize border-b-2 transition ${
                  activeTab === tab
                    ? "border-coffee-800 text-coffee-900"
                    : "border-transparent text-coffee-600 hover:text-coffee-900"
                }`}
              >
                {tab === "today" ? "📅 Today's Plan" : tab === "skills" ? "📊 Skill Map" : "🗺️ Roadmap"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== CONTENT ===== */}
      <div className="max-w-5xl mx-auto px-8 py-8">

        {/* ---- TODAY ---- */}
        {activeTab === "today" && (
          <div className="space-y-6">
            {/* Weekly goals strip */}
            {plan.weeklyGoals.length > 0 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {plan.weeklyGoals.map((g, i) => (
                  <div key={i} className="bg-cream-50 border border-coffee-700/10 rounded-2xl p-4 flex items-start gap-3">
                    <span className="text-xl">{g.icon}</span>
                    <div>
                      <div className="text-sm font-medium text-coffee-900">{g.label}</div>
                      <div className="text-xs text-coffee-500 mt-0.5">{g.target}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Task list */}
            <div>
              <h2 className="font-display text-xl font-semibold text-coffee-900 mb-4">
                Today's tasks
                <span className="ml-2 text-sm font-normal text-coffee-500">
                  {plan.totalMinutes} min total
                </span>
              </h2>
              <div className="space-y-3">
                {plan.dailyTasks.map((task, i) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    index={i}
                    expanded={expandedTask === task.id}
                    onToggle={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ---- SKILLS ---- */}
        {activeTab === "skills" && (
          <div className="space-y-8">
            {plan.criticalSkills.length > 0 && (
              <SkillSection title="🚨 Critical — below 50%" skills={plan.criticalSkills} color="red" />
            )}
            {plan.weakSkills.length > 0 && (
              <SkillSection title="⚠️ Weak — 50-70%" skills={plan.weakSkills} color="yellow" />
            )}
            {plan.improvingSkills.length > 0 && (
              <SkillSection title="📈 Improving" skills={plan.improvingSkills} color="green" />
            )}
            {plan.strongSkills.length > 0 && (
              <SkillSection title="✅ Strong — above 80%" skills={plan.strongSkills} color="green" />
            )}
            {skillStats.filter(s => s.total < 3).length > 0 && (
              <div className="bg-cream-50 border border-coffee-700/10 rounded-2xl p-5">
                <div className="text-xs font-medium text-coffee-500 uppercase tracking-wider mb-3">
                  📝 Not enough data yet (under 3 attempts)
                </div>
                <div className="flex flex-wrap gap-2">
                  {skillStats.filter(s => s.total < 3).map(s => (
                    <span key={s.skill} className="text-xs bg-cream-100 text-coffee-600 px-3 py-1.5 rounded-full border border-coffee-700/10">
                      {s.label} ({s.total})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---- ROADMAP ---- */}
        {activeTab === "roadmap" && (
          <div className="space-y-8">
            {/* Milestones */}
            {plan.milestones.length > 0 && (
              <div>
                <h2 className="font-display text-xl font-semibold text-coffee-900 mb-4">Milestones</h2>
                <div className="space-y-3">
                  {plan.milestones.map((m, i) => (
                    <div key={i} className="flex items-start gap-4 bg-cream-50 border border-coffee-700/10 rounded-2xl p-5">
                      <div className="w-10 h-10 rounded-xl bg-coffee-800 text-cream-50 grid place-items-center text-sm font-semibold shrink-0">
                        W{m.week}
                      </div>
                      <div>
                        <div className="font-medium text-coffee-900">{m.label}</div>
                        <div className="text-sm text-coffee-600 mt-0.5">{m.target}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full test schedule */}
            {plan.fullTestSchedule.length > 0 && (
              <div>
                <h2 className="font-display text-xl font-semibold text-coffee-900 mb-4">
                  Scheduled mock exams
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {plan.fullTestSchedule.map((t, i) => (
                    <div key={i} className="bg-cream-50 border border-coffee-700/10 rounded-2xl p-5 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-cream-200 grid place-items-center text-lg">⏱️</div>
                      <div>
                        <div className="font-medium text-coffee-900">Full mock exam #{i + 1}</div>
                        <div className="text-sm text-coffee-600">{t}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No roadmap data */}
            {plan.milestones.length === 0 && plan.fullTestSchedule.length === 0 && (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">📅</div>
                <div className="font-display text-xl font-semibold text-coffee-900 mb-2">
                  Set your exam date to unlock the full roadmap
                </div>
                <p className="text-coffee-600 text-sm mb-6">
                  Your exam date lets me plan milestones, schedule mock exams, and pace your prep perfectly.
                </p>
                <Link href="/app/profile" className="inline-block bg-coffee-800 text-cream-50 px-6 py-3 rounded-full text-sm font-medium hover:bg-coffee-900 transition">
                  Set exam date →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Task Card ----
function TaskCard({ task, index, expanded, onToggle }: {
  task: DailyTask; index: number; expanded: boolean; onToggle: () => void;
}) {
  const priorityColors = {
    critical: "border-red-300 bg-red-50/50",
    high: "border-orange-200 bg-orange-50/30",
    medium: "border-coffee-700/15 bg-cream-50",
    low: "border-coffee-700/10 bg-cream-50",
  };
  const priorityBadge = {
    critical: "bg-red-100 text-red-700",
    high: "bg-orange-100 text-orange-700",
    medium: "bg-cream-200 text-coffee-600",
    low: "bg-cream-100 text-coffee-500",
  };

  return (
    <div className={`rounded-2xl border transition-all duration-200 ${priorityColors[task.priority]}`}>
      <div className="flex items-center gap-4 p-5">
        <div className="text-xs font-semibold text-coffee-500 w-6 shrink-0">
          {String(index + 1).padStart(2, "0")}
        </div>
        <div className="text-2xl shrink-0">{task.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-coffee-900">{task.title}</span>
            <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full ${priorityBadge[task.priority]}`}>
              {task.priority}
            </span>
          </div>
          <div className="text-sm text-coffee-600 mt-0.5">{task.subtitle}</div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-coffee-500 bg-cream-100 px-2.5 py-1 rounded-full hidden sm:block">
            {task.duration} min
          </span>
          <button
            onClick={onToggle}
            className="text-xs text-coffee-500 hover:text-coffee-800 transition px-2 py-1"
            title="Why this task?"
          >
            {expanded ? "▲" : "Why?"}
          </button>
          <Link
            href={task.href}
            className="bg-coffee-800 hover:bg-coffee-900 text-cream-50 text-sm font-medium px-4 py-2 rounded-full transition"
          >
            Start →
          </Link>
        </div>
      </div>
      {expanded && (
        <div className="px-5 pb-5 pt-0">
          <div className="bg-cream-100 rounded-xl p-4 border border-coffee-700/10">
            <div className="text-xs text-accent uppercase tracking-wider font-semibold mb-1.5">
              🤖 Why this task?
            </div>
            <p className="text-sm text-coffee-700 leading-relaxed">{task.why}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Skill Section ----
function SkillSection({ title, skills, color }: {
  title: string; skills: SkillStat[]; color: "red" | "yellow" | "green";
}) {
  const barColor = color === "red" ? "bg-red-400" : color === "yellow" ? "bg-yellow-400" : "bg-green-500";
  const trackColor = color === "red" ? "bg-red-100" : color === "yellow" ? "bg-yellow-100" : "bg-green-100";

  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-coffee-900 mb-3">{title}</h2>
      <div className="space-y-2.5">
        {skills.map(s => (
          <div key={s.skill} className="bg-cream-50 border border-coffee-700/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-medium text-coffee-900 text-sm">{s.label}</span>
                <span className="text-xs text-coffee-500 ml-2">
                  {s.section === "math" ? "Math" : "R&W"}
                  {" · "}{s.total} attempts
                </span>
              </div>
              <div className="flex items-center gap-2">
                {s.trend !== undefined && s.trend !== 0 && (
                  <span className={`text-xs font-medium ${s.trend > 0 ? "text-green-600" : "text-red-600"}`}>
                    {s.trend > 0 ? "▲" : "▼"} {Math.abs(s.trend)}%
                  </span>
                )}
                <span className="font-display text-xl font-semibold text-coffee-900">{s.pct}%</span>
              </div>
            </div>
            <div className={`h-2 rounded-full ${trackColor}`}>
              <div
                className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                style={{ width: `${s.pct}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-coffee-400">0%</span>
              <span className="text-[10px] text-coffee-400">100%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
