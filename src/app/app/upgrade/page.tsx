import Link from "next/link";

export default function UpgradePage() {
  return (
    <div className="p-10 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="text-xs text-accent uppercase tracking-[0.15em] font-semibold mb-2">
          Premium
        </div>
        <h1 className="font-display text-4xl font-semibold text-coffee-900 dark:text-cream-50 mb-2">
          Unlock everything
        </h1>
        <p className="text-coffee-600 dark:text-cream-200/70 text-lg">
          Full access to every drill, mock, and explanation.
        </p>
      </div>

      {/* Premium features card */}
      <div className="bg-gradient-to-br from-coffee-800 to-coffee-900 dark:from-midnight-50 dark:to-midnight-100 text-cream-100 rounded-3xl p-8 sm:p-10 mb-6">
        <div className="text-xs text-cream-200/70 uppercase tracking-wider font-semibold mb-3">
          Everything you get
        </div>
        <ul className="space-y-3 mb-8">
          {[
            "Unlimited drills across every R&W and Math skill",
            "Full-length adaptive mock exams (Bluebook-style)",
            "Hand-written explanations for every question",
            "Detailed progress tracking & weak-skill analysis",
            "Built-in calculator, reference sheet, passage highlighter",
            "Vocabulary builder with spaced repetition",
            "Personalised daily study plan",
            "All future updates included",
          ].map((f) => (
            <li key={f} className="flex items-start gap-3 text-cream-100">
              <span className="text-accent text-lg leading-none mt-0.5">✓</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Private beta — contact for access */}
      <div className="bg-cream-50 dark:bg-midnight-100 border border-coffee-700/15 dark:border-cream-200/8 rounded-3xl p-8">
        <div className="flex items-start gap-4 mb-4">
          <div className="text-3xl shrink-0">🌱</div>
          <div>
            <div className="font-display text-xl font-semibold text-coffee-900 dark:text-cream-50 mb-1">
              Currently in private beta
            </div>
            <p className="text-sm text-coffee-700 dark:text-cream-200/80 leading-relaxed">
              SATPrep is in its early access phase. Premium access isn't open self-serve yet — we're working with students directly to make sure everything's perfect.
            </p>
          </div>
        </div>
        <p className="text-sm text-coffee-700 dark:text-cream-200/80 leading-relaxed mb-5">
          If you'd like premium access, please reach out and we'll talk you through how to join.
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href="mailto:your-email@example.com?subject=SATPrep%20premium%20access"
            className="inline-flex items-center gap-2 bg-coffee-800 dark:bg-accent text-cream-50 px-5 py-2.5 rounded-full text-sm font-medium hover:scale-[1.02] transition"
          >
            <span>✉️</span> Contact us
          </a>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/app"
          className="text-coffee-600 dark:text-cream-200/70 hover:text-coffee-900 dark:hover:text-cream-50 text-sm transition"
        >
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}
