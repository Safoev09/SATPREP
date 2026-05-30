"use client";

import Link from "next/link";
import { useState } from "react";
import CountUp from "@/components/CountUp";
import type { Recommendation } from "@/lib/recommendations";

type Session = {
  id: number;
  mode: string;
  skill: string | null;
  section: string;
  scaled_score: number | null;
  correct_count: number | null;
  total_questions: number | null;
  completed_at: string | null;
};

type SkillStat = {
  skill: string;
  label: string;
  section: "reading_writing" | "math";
  pct: number;
  total: number;
};

export default function DashboardView({
  firstName,
  targetScore,
  previousScore,
  examDateDisplay,
  daysUntilExam,
  xp,
  streak,
  longestStreak,
  lastActivityDate,
  diagnosticDone,
  lastDiagnostic,
  recentSessions,
  scoredSessions,
  skillStats,
  totalAnswered,
  totalCorrect,
  recommendation,
}: {
  firstName: string;
  targetScore: number | null;
  previousScore: number | null;
  examDateDisplay: string | null;
  daysUntilExam: number | null;
  xp: number;
  streak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  diagnosticDone: boolean;
  lastDiagnostic: { id: number; correct_count: number | null; total_questions: number | null } | null;
  recentSessions: Session[];
  scoredSessions: Session[];
  skillStats: SkillStat[];
  totalAnswered: number;
  totalCorrect: number;
  recommendation: Recommendation;
}) {
  const [radarSection, setRadarSection] = useState<"reading_writing" | "math">("reading_writing");

  const overallPct = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  const today = new Date();
  const dayLabels = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
  const todayIdx = (today.getDay() + 6) % 7;
  const practisedToday = lastActivityDate === today.toISOString().slice(0, 10);

  const level = Math.floor(xp / 500) + 1;
  const xpIntoLevel = xp % 500;
  const xpPct = Math.round((xpIntoLevel / 500) * 100);

  const radarSkills = skillStats.filter((s) => s.section === radarSection);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* ===== HEADER ===== */}
      <div className="mb-6 animate-fadeup">
        <div className="text-xs text-accent uppercase tracking-[0.15em] font-semibold mb-1">
          Today's plan
        </div>
        <h1 className="font-display text-4xl font-semibold text-coffee-900 dark:text-cream-50">
          {firstName}, here's today's route.
        </h1>
        <p className="text-coffee-600 dark:text-cream-200/70 mt-1.5">
          Target {targetScore ?? "—"} ·{" "}
          {examDateDisplay ? `Exam ${examDateDisplay}` : "Exam date not set"}
        </p>
      </div>

      {/* ===== RECOMMENDATION BANNER ===== */}
      <RecommendationCard rec={recommendation} />

      {/* ===== TOP GRID ===== */}
      <div className="grid grid-cols-3 gap-5 mb-5">
        {/* LEFT 2/3 */}
        <div className="col-span-2 space-y-5">
          {/* Score snapshot */}
          <div className="bg-cream-50 dark:bg-midnight-100 rounded-3xl p-6 border border-coffee-700/10 dark:border-cream-200/8 animate-fadeup" style={{ animationDelay: "60ms" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs text-coffee-500 dark:text-cream-200/50 uppercase tracking-wider font-semibold">
                Score snapshot
              </div>
              {targetScore && (
                <div className="text-xs text-coffee-500 dark:text-cream-200/50">Goal {targetScore}</div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <SnapshotStat
                label="Diagnostic"
                value={
                  lastDiagnostic
                    ? `${lastDiagnostic.correct_count}/${lastDiagnostic.total_questions}`
                    : "—"
                }
                sub={lastDiagnostic ? "questions correct" : "not taken yet"}
              />
              <SnapshotStat
                label="Overall accuracy"
                value={totalAnswered > 0 ? `${overallPct}%` : "—"}
                sub={`${totalAnswered} practised`}
              />
              <SnapshotStat
                label="Previous SAT"
                value={previousScore ? String(previousScore) : "—"}
                sub={previousScore ? "your baseline" : "not set"}
              />
            </div>
          </div>

          {/* Progress radar */}
          <div className="bg-cream-50 dark:bg-midnight-100 rounded-3xl p-6 border border-coffee-700/10 dark:border-cream-200/8 animate-fadeup" style={{ animationDelay: "120ms" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs text-coffee-500 dark:text-cream-200/50 uppercase tracking-wider font-semibold">
                  Progress radar
                </div>
                <div className="font-display font-semibold text-coffee-900 dark:text-cream-50 text-lg">
                  Your skill shape
                </div>
              </div>
              <div className="flex bg-cream-100 dark:bg-midnight-50 rounded-full p-1">
                <button
                  onClick={() => setRadarSection("reading_writing")}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
                    radarSection === "reading_writing"
                      ? "bg-coffee-800 text-cream-50"
                      : "text-coffee-600"
                  }`}
                >
                  R&W
                </button>
                <button
                  onClick={() => setRadarSection("math")}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
                    radarSection === "math"
                      ? "bg-coffee-800 text-cream-50"
                      : "text-coffee-600"
                  }`}
                >
                  Math
                </button>
              </div>
            </div>

            {radarSkills.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-3xl mb-2 animate-floaty">📡</div>
                <div className="font-display font-medium text-coffee-800 dark:text-cream-100">
                  No skill shape yet
                </div>
                <p className="text-sm text-coffee-600 dark:text-cream-200/70 mt-1 max-w-xs mx-auto">
                  Finish a few drills and SATPrep will map your {radarSection === "math" ? "Math" : "R&W"} patterns here.
                </p>
              </div>
            ) : (
              <RadarChart key={radarSection} skills={radarSkills} />
            )}
          </div>

          {/* Today's route */}
          <div className="bg-cream-50 dark:bg-midnight-100 rounded-3xl p-6 border border-coffee-700/10 dark:border-cream-200/8 animate-fadeup" style={{ animationDelay: "180ms" }}>
            <div className="text-xs text-coffee-500 dark:text-cream-200/50 uppercase tracking-wider font-semibold mb-1">
              Today's route
            </div>
            <div className="font-display font-semibold text-coffee-900 dark:text-cream-50 text-lg mb-4">
              {diagnosticDone ? "Your next steps" : "Start here"}
            </div>
            <div className="space-y-2.5">
              {!diagnosticDone && (
                <RouteStep num={1} href="/app/diagnostic" title="Take your diagnostic" subtitle="30 min · sets your baseline & focus areas" icon="📋" />
              )}
              <RouteStep num={diagnosticDone ? 1 : 2} href="/app/rw/drills" title="Reading & Writing drill" subtitle="Practise one skill at a time" icon="📖" />
              <RouteStep num={diagnosticDone ? 2 : 3} href="/app/math/drills" title="Math drill" subtitle="Sharpen your weakest topics" icon="🧮" />
              <RouteStep num={diagnosticDone ? 3 : 4} href="/app/full-test" title="Full mock exam" subtitle="The real thing, start to finish" icon="📝" />
            </div>
          </div>
        </div>

        {/* RIGHT RAIL */}
        <div className="space-y-5">
          {/* Streak */}
          <div className="bg-cream-50 dark:bg-midnight-100 rounded-3xl p-6 border border-coffee-700/10 dark:border-cream-200/8 animate-fadeup" style={{ animationDelay: "60ms" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl animate-flicker">🔥</div>
              <div>
                <div className="font-display text-3xl font-semibold text-coffee-900 dark:text-cream-50 leading-none">
                  <CountUp value={streak} />
                </div>
                <div className="text-xs text-coffee-600 dark:text-cream-200/70 mt-1">day streak</div>
              </div>
            </div>
            <div className="flex justify-between gap-1">
              {dayLabels.map((d, i) => {
                const isToday = i === todayIdx;
                const lit = isToday && practisedToday;
                return (
                  <div key={d} className="flex flex-col items-center gap-1">
                    <div
                      className={`w-7 h-7 rounded-lg grid place-items-center text-xs transition ${
                        lit
                          ? "bg-accent text-cream-50 animate-softpulse"
                          : isToday
                          ? "bg-cream-200 border-2 border-accent/40 text-coffee-600"
                          : "bg-cream-100 text-coffee-500"
                      }`}
                    >
                      {lit ? "🔥" : ""}
                    </div>
                    <span className="text-[10px] text-coffee-500 dark:text-cream-200/50">{d}</span>
                  </div>
                );
              })}
            </div>
            {longestStreak > 0 && (
              <div className="text-[11px] text-coffee-500 dark:text-cream-200/50 mt-3 text-center">
                Longest streak: {longestStreak} days
              </div>
            )}
          </div>

          {/* XP / Level */}
          <div className="bg-coffee-800 dark:bg-accent/90 text-cream-100 rounded-3xl p-6 relative overflow-hidden animate-fadeup" style={{ animationDelay: "120ms" }}>
            {/* shimmer sweep */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none animate-shimmer"
              style={{
                background:
                  "linear-gradient(110deg, transparent 30%, #B5895D 50%, transparent 70%)",
                backgroundSize: "200% 100%",
              }}
            />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl animate-floaty">💎</div>
                <div>
                  <div className="font-display text-2xl font-semibold text-cream-50 leading-none">
                    Level {level}
                  </div>
                  <div className="text-xs text-cream-200 mt-1">
                    <CountUp value={xp} /> total XP
                  </div>
                </div>
              </div>
              <div className="h-2.5 bg-coffee-900 dark:bg-midnight-200 rounded-full overflow-hidden mb-1.5">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-1000"
                  style={{ width: `${xpPct}%` }}
                />
              </div>
              <div className="text-[11px] text-cream-200">
                {500 - xpIntoLevel} XP to level {level + 1}
              </div>
            </div>
          </div>

          {/* Exam countdown */}
          <div className="bg-cream-50 dark:bg-midnight-100 rounded-3xl p-6 border border-coffee-700/10 dark:border-cream-200/8 animate-fadeup" style={{ animationDelay: "180ms" }}>
            <div className="text-xs text-coffee-500 dark:text-cream-200/50 uppercase tracking-wider font-semibold mb-2">
              Exam countdown
            </div>
            {daysUntilExam !== null && daysUntilExam >= 0 ? (
              <>
                <div className="font-display text-4xl font-semibold text-coffee-900 dark:text-cream-50">
                  <CountUp value={daysUntilExam} />
                </div>
                <div className="text-sm text-coffee-600 dark:text-cream-200/70">
                  days until {examDateDisplay}
                </div>
              </>
            ) : (
              <>
                <div className="font-display text-xl font-semibold text-coffee-900 dark:text-cream-50 mb-1">
                  No exam date set
                </div>
                <Link href="/app/profile" className="text-sm text-accent hover:underline">
                  Set your exam date →
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* RECENT RESULTS */}
      {scoredSessions.length > 0 && (
        <div className="bg-cream-50 dark:bg-midnight-100 rounded-3xl p-6 border border-coffee-700/10 dark:border-cream-200/8 animate-fadeup" style={{ animationDelay: "220ms" }}>
          <div className="text-xs text-coffee-500 dark:text-cream-200/50 uppercase tracking-wider font-semibold mb-4">
            Recent results
          </div>
          <div className="space-y-2">
            {scoredSessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-2.5 px-4 bg-cream-100 dark:bg-midnight-50 rounded-xl">
                <div>
                  <div className="text-sm font-medium text-coffee-900 dark:text-cream-50 capitalize">
                    {s.mode.replace("_", " ")}
                  </div>
                  <div className="text-xs text-coffee-500 dark:text-cream-200/50">
                    {s.completed_at ? new Date(s.completed_at).toLocaleDateString() : ""}
                  </div>
                </div>
                <div className="font-display text-2xl font-semibold text-coffee-800 dark:text-cream-100">
                  {s.scaled_score}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Recommendation card =====
function RecommendationCard({ rec }: { rec: Recommendation }) {
  const toneStyles: Record<string, { bg: string; emoji: string }> = {
    start: { bg: "from-accent/20 to-cream-200", emoji: "🚀" },
    focus: { bg: "from-accent/25 to-cream-200", emoji: "🎯" },
    improve: { bg: "from-accent/15 to-cream-100", emoji: "📈" },
    celebrate: { bg: "from-accent/20 to-cream-200", emoji: "🌟" },
  };
  const t = toneStyles[rec.tone] ?? toneStyles.start;

  return (
    <div
      className={`bg-gradient-to-r ${t.bg} rounded-3xl p-6 border border-accent/20 mb-5 flex items-center gap-5 animate-fadeup`}
    >
      <div className="text-4xl animate-floaty shrink-0">{t.emoji}</div>
      <div className="flex-1">
        <div className="text-[11px] text-accent uppercase tracking-wider font-semibold mb-0.5">
          Recommended for you
        </div>
        <div className="font-display font-semibold text-coffee-900 dark:text-cream-50 text-lg">
          {rec.headline}
        </div>
        <p className="text-sm text-coffee-600 dark:text-cream-200/70 mt-0.5">{rec.reason}</p>
      </div>
      <Link
        href={rec.ctaHref}
        className="bg-coffee-800 dark:bg-accent/90 hover:bg-coffee-900 dark:bg-midnight-200 text-cream-50 px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition shrink-0"
      >
        {rec.ctaLabel} →
      </Link>
    </div>
  );
}

function SnapshotStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-cream-100 dark:bg-midnight-50 rounded-2xl p-4 hover:bg-cream-200 dark:hover:bg-midnight-50/70 transition">
      <div className="text-[11px] text-coffee-500 dark:text-cream-200/50 uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className="font-display text-3xl font-semibold text-coffee-900 dark:text-cream-50 leading-none">
        {value}
      </div>
      <div className="text-xs text-coffee-500 dark:text-cream-200/50 mt-1">{sub}</div>
    </div>
  );
}

function RouteStep({
  num,
  href,
  title,
  subtitle,
  icon,
}: {
  num: number;
  href: string;
  title: string;
  subtitle: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 p-4 bg-cream-100 dark:bg-midnight-50 hover:bg-cream-200 dark:hover:bg-midnight-50 rounded-2xl transition group"
    >
      <div className="text-xs font-semibold text-coffee-500 dark:text-cream-200/50 w-5">
        {String(num).padStart(2, "0")}
      </div>
      <div className="text-2xl group-hover:animate-floaty">{icon}</div>
      <div className="flex-1">
        <div className="font-medium text-coffee-900 dark:text-cream-50 text-sm">{title}</div>
        <div className="text-xs text-coffee-500 dark:text-cream-200/50">{subtitle}</div>
      </div>
      <div className="text-coffee-500 dark:text-cream-200/50 group-hover:text-coffee-700 dark:text-cream-200 group-hover:translate-x-0.5 transition">
        →
      </div>
    </Link>
  );
}

// Animated SVG radar chart — the data polygon fades/scales in
function RadarChart({ skills }: { skills: SkillStat[] }) {
  const pts = skills.slice(0, 8);
  const n = pts.length;
  const size = 280;
  const center = size / 2;
  const maxR = size / 2 - 50;

  if (n < 3) {
    return (
      <div className="space-y-3 py-2">
        {pts.map((s, i) => (
          <div key={s.skill} className="animate-fadeup" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-coffee-800 dark:text-cream-100">{s.label}</span>
              <span className="text-coffee-500 dark:text-cream-200/50">{s.pct}%</span>
            </div>
            <div className="h-2.5 bg-cream-100 dark:bg-midnight-50 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-1000"
                style={{ width: `${s.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const angleFor = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const coord = (i: number, r: number) => ({
    x: center + Math.cos(angleFor(i)) * r,
    y: center + Math.sin(angleFor(i)) * r,
  });

  const rings = [0.25, 0.5, 0.75, 1];
  const dataPoints = pts.map((s, i) => coord(i, (s.pct / 100) * maxR));
  const dataPath =
    dataPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + "Z";

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {rings.map((r, ri) => {
          const ringPath =
            pts
              .map((_, i) => {
                const p = coord(i, r * maxR);
                return `${i === 0 ? "M" : "L"}${p.x},${p.y}`;
              })
              .join(" ") + "Z";
          return <path key={ri} d={ringPath} fill="none" stroke="#ECE2CD" strokeWidth={1} />;
        })}
        {pts.map((_, i) => {
          const p = coord(i, maxR);
          return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="#ECE2CD" strokeWidth={1} />;
        })}
        {/* data polygon, scales in from centre */}
        <g style={{ transformOrigin: `${center}px ${center}px`, animation: "countup 0.9s ease-out both" }}>
          <path d={dataPath} fill="#B5895D" fillOpacity={0.25} stroke="#B5895D" strokeWidth={2} />
          {dataPoints.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="#8B6B4A" />
          ))}
        </g>
        {pts.map((s, i) => {
          const p = coord(i, maxR + 22);
          return (
            <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize={9} fill="#6E5036">
              {s.label.length > 16 ? s.label.slice(0, 15) + "…" : s.label}
            </text>
          );
        })}
      </svg>
      <p className="text-xs text-coffee-500 dark:text-cream-200/50 mt-2">
        Further from centre = stronger. Based on your practice so far.
      </p>
    </div>
  );
}
