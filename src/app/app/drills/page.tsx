import Link from "next/link";

export default function DrillsPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="text-center mb-10 mt-4">
        <div className="text-xs text-accent uppercase tracking-[0.15em] font-semibold mb-2">
          Practice
        </div>
        <h1 className="font-display text-4xl font-semibold text-coffee-900 dark:text-cream-50 mb-3">
          Drills
        </h1>
        <p className="text-coffee-600 dark:text-cream-200/70 max-w-xl mx-auto">
          Pick a section, target the exact skill you want to sharpen, choose the pressure, and start.
        </p>
      </div>

      {/* What is a drill */}
      <div className="glass rounded-3xl p-6 mb-8 max-w-3xl mx-auto">
        <div className="flex items-start gap-4">
          <div className="text-3xl shrink-0">⚡</div>
          <div>
            <div className="font-display font-semibold text-coffee-900 dark:text-cream-50 mb-1.5">
              What is a drill?
            </div>
            <p className="text-sm text-coffee-700 dark:text-cream-200/80 leading-relaxed">
              A focused practice session: pick one skill, set the question count and difficulty, and work through real-style questions one at a time with instant explanations.
            </p>
          </div>
        </div>
      </div>

      {/* Two subject cards */}
      <div className="grid sm:grid-cols-2 gap-5 mb-12">
        <Link
          href="/app/rw/drills"
          className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent/20 to-cream-200 dark:from-accent/15 dark:to-midnight-50 p-8 border border-coffee-700/10 dark:border-cream-200/8 hover:scale-[1.015] transition-all duration-300"
        >
          <div className="text-5xl mb-4">📖</div>
          <div className="font-display text-2xl font-semibold text-coffee-900 dark:text-cream-50 mb-1">
            Reading & Writing
          </div>
          <div className="text-sm text-coffee-600 dark:text-cream-200/70 mb-4">
            Information & ideas, craft & structure, expression, grammar
          </div>
          <div className="inline-flex items-center gap-2 bg-coffee-800 dark:bg-accent text-cream-50 px-5 py-2.5 rounded-full text-sm font-medium group-hover:gap-3 transition-all">
            Start drilling
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </div>
        </Link>

        <Link
          href="/app/math/drills"
          className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-coffee-800 to-coffee-900 dark:from-midnight-50 dark:to-midnight-100 p-8 border border-coffee-700/10 dark:border-cream-200/8 hover:scale-[1.015] transition-all duration-300"
        >
          <div className="text-5xl mb-4">🧮</div>
          <div className="font-display text-2xl font-semibold text-cream-50 mb-1">
            Math
          </div>
          <div className="text-sm text-cream-200/70 mb-4">
            Algebra, advanced math, problem-solving, geometry & trig
          </div>
          <div className="inline-flex items-center gap-2 bg-cream-50 text-coffee-900 px-5 py-2.5 rounded-full text-sm font-medium group-hover:gap-3 transition-all">
            Start drilling
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </div>
        </Link>
      </div>

      {/* How it works */}
      <div className="max-w-3xl mx-auto">
        <div className="font-display text-xl font-semibold text-coffee-900 dark:text-cream-50 text-center mb-6">
          How it works
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { i: "🎯", t: "Pick your focus", s: "One section, one skill, your choice" },
            { i: "⏱️", t: "Set the pressure", s: "Question count and difficulty" },
            { i: "✓", t: "Track the result", s: "Instant scoring + skill insights" },
          ].map((s) => (
            <div key={s.t} className="text-center p-4">
              <div className="text-3xl mb-2">{s.i}</div>
              <div className="font-medium text-coffee-900 dark:text-cream-100 mb-1">{s.t}</div>
              <div className="text-xs text-coffee-600 dark:text-cream-200/60">{s.s}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
