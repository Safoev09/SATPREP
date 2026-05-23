import Link from "next/link";

export default function UpgradePage() {
  return (
    <div className="p-10 max-w-3xl">
      <h1 className="font-display text-4xl font-semibold text-coffee-900 mb-2">
        Unlock everything
      </h1>
      <p className="text-coffee-600 mb-10 text-lg">
        One payment. Lifetime access. No subscriptions ever.
      </p>

      <div className="bg-coffee-800 text-cream-100 rounded-3xl p-10 mb-8">
        <div className="font-display text-5xl font-semibold text-cream-50 mb-1">
          19,900 <span className="text-2xl">so'm</span>
        </div>
        <div className="text-cream-200 mb-7">one-time payment · lifetime access</div>
        <ul className="space-y-3 mb-8">
          {["Unlimited drills, modules, full mocks", "Hand-written explanations for every question", "Detailed progress tracking & weak-skill analysis", "Bluebook-style timer, navigator, calculator, references", "All future updates included"].map((f) => (
            <li key={f} className="flex items-center gap-3 text-cream-100">
              <span className="text-accent">✓</span> {f}
            </li>
          ))}
        </ul>
        <button
          disabled
          className="w-full bg-cream-50 text-coffee-900 py-4 rounded-full font-medium opacity-70 cursor-not-allowed"
        >
          Payment integration coming in Phase E
        </button>
        <p className="text-xs text-cream-200 text-center mt-3">Click · Payme · Uzum</p>
      </div>

      <Link href="/app" className="text-coffee-700 hover:text-coffee-900 text-sm">
        ← Back to dashboard
      </Link>
    </div>
  );
}
