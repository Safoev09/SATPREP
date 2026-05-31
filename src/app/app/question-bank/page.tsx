import Link from "next/link";
import { SKILLS } from "@/lib/skills";

export default function QuestionBankPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="text-xs text-accent uppercase tracking-[0.15em] font-semibold mb-1">
          Question library
        </div>
        <h1 className="font-display text-4xl font-semibold text-coffee-900">
          Question Bank
        </h1>
        <p className="text-coffee-600 mt-1.5">
          Browse every Digital SAT skill in one place. Pick one to drill it.
        </p>
      </div>

      {(["reading_writing", "math"] as const).map((section) => {
        const sectionData = SKILLS[section];
        const sectionTitle = section === "reading_writing" ? "Reading & Writing" : "Math";
        const sectionIcon = section === "reading_writing" ? "📖" : "🧮";
        const drillHref = section === "reading_writing" ? "/app/rw/drills" : "/app/math/drills";

        return (
          <div key={section} className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="text-3xl">{sectionIcon}</div>
              <div>
                <h2 className="font-display text-2xl font-semibold text-coffee-900">
                  {sectionTitle}
                </h2>
                <Link
                  href={drillHref}
                  className="text-xs text-accent hover:underline"
                >
                  Drill any of these →
                </Link>
              </div>
            </div>

            <div className="space-y-5">
              {Object.entries(sectionData).map(([domain, skills]) => (
                <div key={domain}>
                  <div className="text-xs text-coffee-500 uppercase tracking-[0.12em] font-semibold mb-2.5">
                    {domain}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                    {(skills as readonly { id: string; label: string }[]).map((s) => (
                      <Link
                        key={s.id}
                        href={`${drillHref}?skill=${encodeURIComponent(s.id)}`}
                        className="group flex items-center justify-between bg-cream-50 border border-coffee-700/10 rounded-2xl p-4 hover:scale-[1.01] hover:shadow-sm hover:border-accent/40 transition-all duration-200"
                      >
                        <span className="text-sm font-medium text-coffee-800">
                          {s.label}
                        </span>
                        <span className="text-coffee-500 group-hover:text-accent group-hover:translate-x-0.5 transition-transform">
                          →
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
