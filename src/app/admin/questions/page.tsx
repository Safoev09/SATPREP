import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { getSkillLabel } from "@/lib/skills";

export default async function QuestionsListPage({
  searchParams,
}: {
  searchParams: { section?: string; skill?: string; difficulty?: string; status?: string };
}) {
  const supabase = createClient();

  let query = supabase
    .from("questions")
    .select("id, source_test, source_question_number, section, skill, difficulty, prompt, is_published, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (searchParams.section) query = query.eq("section", searchParams.section);
  if (searchParams.skill) query = query.eq("skill", searchParams.skill);
  if (searchParams.difficulty) query = query.eq("difficulty", searchParams.difficulty);
  if (searchParams.status === "published") query = query.eq("is_published", true);
  if (searchParams.status === "draft") query = query.eq("is_published", false);

  const { data: questions } = await query;

  return (
    <div className="p-10 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-display text-3xl font-semibold text-coffee-900">
            Question bank
          </h1>
          <p className="text-coffee-600 mt-1">
            {questions?.length ?? 0} question{questions?.length === 1 ? "" : "s"} shown
          </p>
        </div>
        <Link
          href="/admin/questions/new"
          className="bg-coffee-800 hover:bg-coffee-900 text-cream-50 px-5 py-2.5 rounded-full text-sm font-medium transition"
        >
          + Add question
        </Link>
      </div>

      {/* Filters */}
      <form className="bg-cream-50 border border-coffee-700/10 rounded-2xl p-4 mb-6 grid grid-cols-5 gap-3">
        <select name="section" defaultValue={searchParams.section ?? ""}>
          <option value="">All sections</option>
          <option value="reading_writing">Reading & Writing</option>
          <option value="math">Math</option>
        </select>
        <select name="difficulty" defaultValue={searchParams.difficulty ?? ""}>
          <option value="">All difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <select name="status" defaultValue={searchParams.status ?? ""}>
          <option value="">All status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <button
          type="submit"
          className="bg-coffee-700 hover:bg-coffee-800 text-cream-50 rounded-full text-sm font-medium"
        >
          Filter
        </button>
        <Link
          href="/admin/questions"
          className="text-center py-2.5 text-sm text-coffee-700 hover:text-coffee-900"
        >
          Clear
        </Link>
      </form>

      {/* List */}
      {questions && questions.length > 0 ? (
        <div className="bg-cream-50 border border-coffee-700/10 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream-100 text-coffee-700">
              <tr>
                <th className="text-left py-3 px-5">ID</th>
                <th className="text-left py-3 px-5">Source</th>
                <th className="text-left py-3 px-5">Prompt</th>
                <th className="text-left py-3 px-5">Skill</th>
                <th className="text-left py-3 px-5">Diff</th>
                <th className="text-left py-3 px-5">Status</th>
                <th className="text-left py-3 px-5"></th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q) => (
                <tr key={q.id} className="border-t border-coffee-700/5 hover:bg-cream-100/50">
                  <td className="py-3 px-5 text-coffee-700">#{q.id}</td>
                  <td className="py-3 px-5 text-coffee-800 whitespace-nowrap">
                    {q.source_test}
                    {q.source_question_number && (
                      <span className="text-coffee-600 ml-1">·Q{q.source_question_number}</span>
                    )}
                  </td>
                  <td className="py-3 px-5 text-coffee-700 max-w-md">
                    <div className="truncate">{q.prompt}</div>
                  </td>
                  <td className="py-3 px-5 text-coffee-700">{getSkillLabel(q.skill)}</td>
                  <td className="py-3 px-5">
                    <DifficultyPill d={q.difficulty} />
                  </td>
                  <td className="py-3 px-5">
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
                  <td className="py-3 px-5">
                    <Link
                      href={`/admin/questions/${q.id}`}
                      className="text-coffee-700 hover:text-coffee-900 text-sm"
                    >
                      Edit →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-cream-50 border border-coffee-700/10 rounded-2xl p-12 text-center">
          <p className="text-coffee-600 mb-4">
            No questions match these filters.
          </p>
          <Link
            href="/admin/questions/new"
            className="text-coffee-700 hover:text-coffee-900 underline text-sm"
          >
            Add your first question
          </Link>
        </div>
      )}
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
