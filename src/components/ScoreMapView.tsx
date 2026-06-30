"use client";

import Link from "next/link";
import { useState } from "react";
import type { MistakeDNA, DNACategory, DNAWeakness } from "@/lib/mistake-dna";
import { DNA_META } from "@/lib/mistake-dna";

type SkillRow = {
  skill: string; label: string; domain: string;
  correct: number; total: number; pct: number; trend: number;
};

type Session = {
  id: string; mode: string; scaled_score: number | null;
  correct_count: number; total_questions: number; completed_at: string | null;
};

type Props = {
  dna: MistakeDNA;
  skillRows: SkillRow[];
  sessions: Session[];
  userName: string;
  targetScore: number | null;
  previousScore: number | null;
};

type Tab = "dna" | "skills" | "history";

export default function ScoreMapView({ dna, skillRows, sessions, userName, targetScore, previousScore }: Props) {
  const [tab, setTab] = useState<Tab>("dna");
  const [expandedWeak, setExpandedWeak] = useState<DNACategory | null>(null);

  const overallPct = dna.totalAnswers > 0 ? Math.round((dna.totalCorrect / dna.totalAnswers) * 100) : 0;
  const totalLoss = dna.topWeaknesses.reduce((s, w) => s + w.pointsLost, 0);

  return (
    <div className="min-h-screen bg-cream-100">
      {/* ===== HERO ===== */}
      <div className="relative bg-coffee-900 text-cream-50 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-5%] w-[30rem] h-[30rem] rounded-full bg-accent/15 blur-3xl" />
          <div className="absolute bottom-[-30%] right-[0%] w-[36rem] h-[36rem] rounded-full bg-coffee-700/50 blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-8 pt-10 pb-0">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8 pb-8">
            <div>
              <div className="text-accent text-xs font-semibold uppercase tracking-[0.2em] mb-2">Mistake DNA</div>
              <h1 className="font-display text-4xl lg:text-5xl font-semibold leading-tight mb-3">
                {userName}'s Score Map
              </h1>
              <p className="text-cream-200/70 max-w-md leading-relaxed text-sm">
                Every mistake has a pattern. This is yours — analyzed from {dna.totalAnswers} answers.
                {dna.weeklyTrend > 0
                  ? ` You're trending up ${dna.weeklyTrend}% this week. 📈`
                  : dna.weeklyTrend < 0
                  ? ` You've dipped ${Math.abs(dna.weeklyTrend)}% this week. Focus helps.`
                  : ""}
              </p>

              {dna.biggestWin && dna.biggestWin.pointsLost > 10 && (
                <div className="mt-5 inline-flex items-center gap-3 bg-accent/20 border border-accent/30 rounded-2xl px-4 py-3">
                  <span className="text-2xl">{dna.biggestWin.icon}</span>
                  <div>
                    <div className="text-xs text-accent uppercase tracking-wide font-semibold">Biggest opportunity</div>
                    <div className="text-sm font-medium text-cream-50">
                      Fix <span className="text-accent">{dna.biggestWin.label}</span> → gain ~{dna.biggestWin.pointsLost} pts
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-cream-50/10 backdrop-blur-sm rounded-3xl p-6 min-w-[220px] border border-cream-50/10 shrink-0">
              <div className="text-xs text-cream-200/50 uppercase tracking-wider mb-4">Score potential</div>
              {previousScore ? (
                <>
                  <div className="flex items-end gap-3 mb-4">
                    <div>
                      <div className="text-xs text-cream-200/50 mb-0.5">Current</div>
                      <div className="font-display text-4xl font-semibold">{previousScore}</div>
                    </div>
                    {dna.estimatedPotentialScore && dna.estimatedPotentialScore > previousScore && (
                      <>
                        <div className="text-cream-200/30 text-lg mb-1">→</div>
                        <div>
                          <div className="text-xs text-accent mb-0.5">Potential</div>
                          <div className="font-display text-4xl font-semibold text-accent">
                            {dna.estimatedPotentialScore}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  {totalLoss > 0 && (
                    <div className="text-xs text-cream-200/60">~{totalLoss} pts being lost to fixable mistakes</div>
                  )}
                </>
              ) : (
                <div className="text-cream-200/50 text-sm">Set your baseline score in Profile.</div>
              )}
              <div className="mt-4 pt-4 border-t border-cream-50/10 grid grid-cols-2 gap-3">
                <div>
                  <div className="font-display text-xl font-semibold">{overallPct}%</div>
                  <div className="text-xs text-cream-200/50">Overall accuracy</div>
                </div>
                <div>
                  <div className="font-display text-xl font-semibold">{dna.overallConfidence}%</div>
                  <div className="text-xs text-cream-200/50">Diagnosis confidence</div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-cream-50/10 flex gap-0">
            {([
              { id: "dna" as Tab, label: "🧬 Mistake DNA" },
              { id: "skills" as Tab, label: "📊 Skill Map" },
              { id: "history" as Tab, label: "📈 History" },
            ]).map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-5 py-3.5 text-sm font-medium border-b-2 transition ${
                  tab === t.id ? "border-accent text-cream-50" : "border-transparent text-cream-200/50 hover:text-cream-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-8">
        {/* ---- DNA TAB ---- */}
        {tab === "dna" && (
          <div className="space-y-8">
            {dna.totalAnswers < 5 ? (
              <EmptyDNA totalAnswers={dna.totalAnswers} />
            ) : (
              <>
                <div>
                  <h2 className="font-display text-xl font-semibold text-coffee-900 mb-4">
                    Mistake DNA Profile
                    <span className="ml-2 text-sm font-normal text-coffee-500">
                      {dna.overallConfidence}% confidence · {dna.totalAnswers} answers analyzed
                    </span>
                  </h2>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {(Object.keys(DNA_META) as DNACategory[]).map(cat => {
                      const meta = DNA_META[cat];
                      const score = dna.scores[cat] ?? 100;
                      const loss = dna.pointsLost[cat] ?? 0;
                      const level = score >= 80 ? "good" : score >= 60 ? "ok" : score >= 40 ? "warn" : "bad";
                      const levelColors = {
                        good: "bg-green-50 border-green-200", ok: "bg-yellow-50 border-yellow-200",
                        warn: "bg-orange-50 border-orange-200", bad: "bg-red-50 border-red-200",
                      };
                      const barColors = { good: "bg-green-500", ok: "bg-yellow-400", warn: "bg-orange-400", bad: "bg-red-500" };
                      return (
                        <div
                          key={cat}
                          className={`rounded-2xl border p-4 cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md ${levelColors[level]}`}
                          onClick={() => setExpandedWeak(expandedWeak === cat ? null : cat)}
                        >
                          <div className="text-2xl mb-2">{meta.icon}</div>
                          <div className="text-xs font-semibold text-coffee-700 mb-1 leading-tight">{meta.label}</div>
                          <div className="h-1.5 bg-cream-200 rounded-full mb-2">
                            <div className={`h-full rounded-full transition-all duration-700 ${barColors[level]}`} style={{ width: `${score}%` }} />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-display text-lg font-semibold text-coffee-900">{score}</span>
                            {loss > 0 && (
                              <span className="text-[10px] text-red-600 font-medium bg-red-100 px-1.5 py-0.5 rounded-full">-{loss}pts</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {dna.topWeaknesses.length > 0 && (
                  <div>
                    <h2 className="font-display text-xl font-semibold text-coffee-900 mb-4">
                      Top {dna.topWeaknesses.length} Weaknesses
                    </h2>
                    <div className="space-y-3">
                      {dna.topWeaknesses.map((w, i) => (
                        <WeaknessCard
                          key={w.category}
                          weakness={w}
                          rank={i + 1}
                          expanded={expandedWeak === w.category}
                          onToggle={() => setExpandedWeak(expandedWeak === w.category ? null : w.category)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {Object.entries(dna.scores).filter(([, s]) => s >= 80).length > 0 && (
                  <div>
                    <h2 className="font-display text-lg font-semibold text-coffee-900 mb-3">✅ Your Strengths</h2>
                    <div className="flex flex-wrap gap-2">
                      {(Object.entries(dna.scores) as [DNACategory, number][])
                        .filter(([, s]) => s >= 80)
                        .sort(([, a], [, b]) => b - a)
                        .map(([cat, score]) => (
                          <div key={cat} className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-2">
                            <span>{DNA_META[cat].icon}</span>
                            <span className="text-sm font-medium text-green-800">{DNA_META[cat].label}</span>
                            <span className="text-xs font-bold text-green-600">{score}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ---- SKILLS TAB ---- */}
        {tab === "skills" && (
          <div className="space-y-6">
            {skillRows.length === 0 ? (
              <EmptyState icon="📊" title="No skill data yet" desc="Complete some drills to see your skill breakdown." />
            ) : (
              <>
                <h2 className="font-display text-xl font-semibold text-coffee-900">
                  Accuracy by skill <span className="ml-2 text-sm font-normal text-coffee-500">Weakest first</span>
                </h2>
                {Array.from(new Set(skillRows.map(s => s.domain))).map(domain => {
                  const rows = skillRows.filter(s => s.domain === domain);
                  return (
                    <div key={domain}>
                      <div className="text-xs font-semibold text-coffee-500 uppercase tracking-[0.12em] mb-3">{domain}</div>
                      <div className="space-y-2.5">
                        {rows.map(s => {
                          const barColor = s.pct >= 80 ? "bg-green-500" : s.pct >= 60 ? "bg-yellow-400" : s.pct >= 40 ? "bg-orange-400" : "bg-red-500";
                          return (
                            <div key={s.skill} className="bg-cream-50 border border-coffee-700/10 rounded-2xl p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-coffee-900 text-sm">{s.label}</span>
                                  {s.trend !== 0 && (
                                    <span className={`text-xs font-semibold ${s.trend > 0 ? "text-green-600" : "text-red-500"}`}>
                                      {s.trend > 0 ? "▲" : "▼"}{Math.abs(s.trend)}%
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-coffee-500">{s.correct}/{s.total}</span>
                                  <span className="font-display font-bold text-lg text-coffee-900">{s.pct}%</span>
                                </div>
                              </div>
                              <div className="h-2 bg-cream-200 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${s.pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* ---- HISTORY TAB ---- */}
        {tab === "history" && (
          <div className="space-y-8">
            {sessions.filter(s => s.scaled_score).length > 0 && (
              <div>
                <h2 className="font-display text-xl font-semibold text-coffee-900 mb-4">Score History</h2>
                <div className="bg-cream-50 border border-coffee-700/10 rounded-3xl p-6">
                  <div className="flex items-end gap-2 h-40 mb-3">
                    {sessions.filter(s => s.scaled_score).slice(0, 10).reverse().map((s) => {
                      const pct = ((s.scaled_score! - 400) / 1200) * 100;
                      const isTarget = targetScore && s.scaled_score! >= targetScore;
                      return (
                        <div key={s.id} className="flex-1 flex flex-col items-center gap-1">
                          <div className="text-[10px] text-coffee-600 font-semibold">{s.scaled_score}</div>
                          <div
                            className="w-full rounded-t-lg transition-all duration-700"
                            style={{
                              height: `${Math.max(4, pct)}%`,
                              background: isTarget ? "linear-gradient(180deg, #16a34a, #15803d)" : "linear-gradient(180deg, #B5895D, #8B6B4A)"
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  {targetScore && (
                    <div className="text-xs text-coffee-500 text-center">Target: {targetScore} — green bars = target reached</div>
                  )}
                </div>
              </div>
            )}

            {sessions.length > 0 ? (
              <div>
                <h2 className="font-display text-xl font-semibold text-coffee-900 mb-4">All Sessions</h2>
                <div className="bg-cream-50 border border-coffee-700/10 rounded-2xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-cream-100 text-coffee-700 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="text-left py-3 px-5">Date</th>
                        <th className="text-left py-3 px-5">Type</th>
                        <th className="text-left py-3 px-5">Score</th>
                        <th className="text-left py-3 px-5">Accuracy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map((s, i) => {
                        const acc = s.total_questions > 0 ? Math.round((s.correct_count / s.total_questions) * 100) : 0;
                        return (
                          <tr key={s.id} className={`border-t border-coffee-700/5 ${i % 2 === 0 ? "" : "bg-cream-50/50"}`}>
                            <td className="py-3 px-5 text-coffee-600 text-xs">
                              {s.completed_at ? new Date(s.completed_at).toLocaleDateString() : "—"}
                            </td>
                            <td className="py-3 px-5 text-coffee-800 capitalize font-medium">{s.mode.replace(/_/g, " ")}</td>
                            <td className="py-3 px-5 font-display font-semibold text-coffee-900">{s.scaled_score ?? "—"}</td>
                            <td className="py-3 px-5">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-cream-200 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${acc >= 80 ? "bg-green-500" : acc >= 60 ? "bg-yellow-400" : "bg-red-400"}`} style={{ width: `${acc}%` }} />
                                </div>
                                <span className="text-xs text-coffee-700">{acc}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <EmptyState icon="📈" title="No sessions yet" desc="Complete a drill or mock exam to see your history." />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function WeaknessCard({ weakness, rank, expanded, onToggle }: {
  weakness: DNAWeakness; rank: number; expanded: boolean; onToggle: () => void;
}) {
  const urgency = weakness.pointsLost >= 40 ? "critical" : weakness.pointsLost >= 20 ? "high" : "medium";
  const urgencyStyle = {
    critical: "border-red-200 bg-red-50/40", high: "border-orange-200 bg-orange-50/30", medium: "border-yellow-200 bg-yellow-50/20",
  };

  return (
    <div className={`rounded-2xl border-2 overflow-hidden transition ${urgencyStyle[urgency]}`}>
      <button onClick={onToggle} className="w-full flex items-center gap-4 p-5 text-left hover:bg-cream-50/50 transition">
        <div className="w-8 h-8 rounded-full bg-coffee-800 text-cream-50 grid place-items-center text-sm font-bold shrink-0">{rank}</div>
        <div className="text-2xl shrink-0">{weakness.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-coffee-900">{weakness.label}</span>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
              urgency === "critical" ? "bg-red-200 text-red-800" : urgency === "high" ? "bg-orange-200 text-orange-800" : "bg-yellow-200 text-yellow-800"
            }`}>
              {urgency}
            </span>
          </div>
          <div className="text-xs text-coffee-600 mt-0.5 leading-relaxed truncate">{weakness.evidence}</div>
        </div>
        <div className="text-center shrink-0">
          <div className="font-display text-2xl font-bold text-red-600">-{weakness.pointsLost}</div>
          <div className="text-[10px] text-coffee-500">pts lost</div>
        </div>
        <div className="text-coffee-400 text-sm">{expanded ? "▲" : "▼"}</div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-3">
          <div className="bg-coffee-800 rounded-xl p-4">
            <div className="text-xs text-accent uppercase tracking-wide font-semibold mb-1.5">🎯 Coach Recommendation</div>
            <p className="text-sm text-cream-100 leading-relaxed">{weakness.recommendation}</p>
          </div>
          <div className="bg-cream-100 rounded-xl p-4">
            <div className="flex justify-between text-xs text-coffee-600 mb-2">
              <span>Current score: {weakness.score}/100</span>
              <span>Target: 80+</span>
            </div>
            <div className="h-3 bg-cream-200 rounded-full overflow-hidden relative">
              <div className="h-full rounded-full bg-accent transition-all duration-700" style={{ width: `${weakness.score}%` }} />
              <div className="absolute top-0 bottom-0 w-0.5 bg-green-600" style={{ left: "80%" }} />
            </div>
          </div>
          <Link
            href={`/app/drills?skill=${weakness.category}`}
            className="inline-flex items-center gap-2 bg-coffee-800 hover:bg-coffee-900 text-cream-50 text-sm font-medium px-5 py-2.5 rounded-full transition"
          >
            Start {weakness.sessionsNeeded} drill session{weakness.sessionsNeeded > 1 ? "s" : ""} →
          </Link>
        </div>
      )}
    </div>
  );
}

function EmptyDNA({ totalAnswers }: { totalAnswers: number }) {
  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-4">🧬</div>
      <div className="font-display text-2xl font-semibold text-coffee-900 mb-2">Building your DNA profile</div>
      <p className="text-coffee-600 mb-2">
        {totalAnswers > 0
          ? `${totalAnswers}/5 answers collected. ${5 - totalAnswers} more to unlock your Mistake DNA.`
          : "Complete some drills or a diagnostic to start your analysis."}
      </p>
      <div className="flex justify-center gap-1.5 mt-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className={`w-3 h-3 rounded-full ${i < totalAnswers ? "bg-accent" : "bg-cream-300"}`} />
        ))}
      </div>
      <Link href="/app/diagnostic" className="inline-block mt-6 bg-coffee-800 text-cream-50 px-6 py-3 rounded-full text-sm font-medium hover:bg-coffee-900 transition">
        Take the diagnostic →
      </Link>
    </div>
  );
}

function EmptyState({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-4">{icon}</div>
      <div className="font-display text-xl font-semibold text-coffee-900 mb-2">{title}</div>
      <p className="text-coffee-600 text-sm">{desc}</p>
    </div>
  );
}
