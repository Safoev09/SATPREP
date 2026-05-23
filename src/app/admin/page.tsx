import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { getSkillLabel } from "@/lib/skills";

export default async function AdminDashboard() {
  const supabase = createClient();

  // Count questions
  const { count: totalQuestions } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true });

  const { count: publishedQuestions } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("is_published", true);

  const { count: rwQuestions } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("section", "reading_writing");

  const { count: mathQuestions } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("section", "math");

  // Recent questions
  const { data: recent } = await supabase
    .from("questions")
    .select("id, source_test, section, skill, difficulty, is_published, created_at")
    .order("created_at", { ascending: false })
    .limit(8);

  return (
    <div className="p-10 max-w-6xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-coffee-900">
          Dashboard
        </h1>
        <p className="text-coffee-600 mt-1">Welcome back. Here's your question bank overview.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-10">
        <StatCard label="Total questions" value={totalQuestions ?? 0} />
        <StatCard label="Published" value={publishedQuestions ?? 0} />
        <StatCard label="Reading & Writing" value={rwQuestions ?? 0} />
        <StatCard label="Math" value={mathQuestions ?? 0} />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        <Link
          href="/admin/questions/new"
          className="block bg-cream-50 hover:bg-cream-100 border border-coffee-700/10 rounded-2xl p-6 transition"
        >
          <div className="text-2xl mb-2">➕</div>
          <div className="font-display font-semibold text-lg text-coffee-900">
            Add a question
          </div>
          <div className="text-sm text-coffee-600 mt-1">
            Manually enter a single question with all its fields.
          </div>
        </Link>
        <Link
          href="/admin/upload"
          className="block bg-coffee-800 hover:bg-coffee-900 text-cream-100 rounded-2xl p-6 transition"
        >
          <div className="text-2xl mb-2">📄</div>
          <div className="font-display font-semibold text-lg text-cream-50">
            Upload a PDF
          </div>
          <div className="text-sm text-cream-200 mt-1">
            Bulk-import an official College Board practice test.
          </div>
        </Link>
      </div>

      {/* Recent */}
      <div className="bg-cream-50 border border-coffee-700/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-coffee-700/10 flex justify-between items-center">
          <h2 className="font-display font-semibold text-lg text-coffee-900">
            Recent questions
          </h2>
          <Link
            href="/admin/questions"
            className="text-sm text-coffee-700 hover:text-coffee-900"
          >
            View all →
          </Link>
        </div>
        {recent && recent.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-cream-100 text-coffee-700">
              <tr>
                <th className="text-left py-3 px-6">ID</th>
                <th className="text-left py-3 px-6">Source</th>
                <th className="text-left py-3 px-6">Section</th>
                <th className="text-left py-3 px-6">Skill</th>
                <th className="text-left py-3 px-6">Difficulty</th>
                <th className="text-left py-3 px-6">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((q) => (
                <tr key={q.id} className="border-t border-coffee-700/5 hover:bg-cream-100/50">
                  <td className="py-3 px-6 text-coffee-700">#{q.id}</td>
                  <td className="py-3 px-6 text-coffee-800">{q.source_test}</td>
                  <td className="py-3 px-6 text-coffee-700">
                    {q.section === "reading_writing" ? "R&W" : "Math"}
                  </td>
                  <td className="py-3 px-6 text-coffee-700">{getSkillLabel(q.skill)}</td>
                  <td className="py-3 px-6">
                    <DifficultyPill d={q.difficulty} />
                  </td>
                  <td className="py-3 px-6">
                    {q.is_published ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                        Published
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-cream-200 text-coffee-700">
                        Draft
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-10 text-center text-coffee-600">
            No questions yet. Add your first one to get started.
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-cream-50 border border-coffee-700/10 rounded-2xl p-5">
      <div className="text-xs text-coffee-600 uppercase tracking-wider">{label}</div>
      <div className="font-display text-3xl font-semibold text-coffee-900 mt-1">
        {value}
      </div>
    </div>
  );
}

function DifficultyPill({ d }: { d: string }) {
  const styles: Record<string, string> = {
    easy: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    hard: "bg-red-100 text-red-800",
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-full ${styles[d] ?? "bg-cream-200 text-coffee-700"}`}>
      {d}
    </span>
  );
}
