import Link from "next/link";

export default function ComingSoon({
  title,
  description,
  emoji = "🚧",
}: {
  title: string;
  description: string;
  emoji?: string;
}) {
  return (
    <div className="p-10 max-w-3xl">
      <div className="bg-cream-50 border border-coffee-700/10 rounded-3xl p-12 text-center">
        <div className="text-6xl mb-4">{emoji}</div>
        <h1 className="font-display text-3xl font-semibold text-coffee-900 mb-3">
          {title}
        </h1>
        <p className="text-coffee-600 max-w-md mx-auto mb-7">{description}</p>
        <Link
          href="/app"
          className="inline-block bg-coffee-800 hover:bg-coffee-900 text-cream-50 px-6 py-2.5 rounded-full font-medium text-sm"
        >
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}
