import Link from "next/link";
import { createClient } from "@/lib/supabase-server";

export default async function TestsListPage() {
  const supabase = createClient();

  const { data: tests } = await supabase
    .from("tests")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="p-10 max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-display text-3xl font-semibold text-coffee-900">
            Tests
          </h1>
          <p className="text-coffee-600 mt-1">
            Hand-built modules and full SAT tests. Students pick from your published tests.
          </p>
        </div>
        <Link
          href="/admin/tests/new"
          className="bg-coffee-800 hover:bg-coffee-900 text-cream-50 px-5 py-2.5 rounded-full text-sm font-medium"
        >
          + Create test
        </Link>
      </div>

      {tests && tests.length > 0 ? (
        <div className="bg-cream-50 border border-coffee-700/10 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream-100 text-coffee-700">
              <tr>
                <th className="text-left py-3 px-5">Title</th>
                <th className="text-left py-3 px-5">Type</th>
                <th className="text-left py-3 px-5">Section</th>
                <th className="text-left py-3 px-5">Access</th>
                <th className="text-left py-3 px-5">Status</th>
                <th className="text-left py-3 px-5"></th>
              </tr>
            </thead>
            <tbody>
              {tests.map((t) => (
                <tr key={t.id} className="border-t border-coffee-700/5 hover:bg-cream-100/50">
                  <td className="py-3 px-5 text-coffee-900 font-medium">{t.title}</td>
                  <td className="py-3 px-5 text-coffee-700">
                    {t.test_type === "full" ? "Full SAT" : "Module"}
                  </td>
                  <td className="py-3 px-5 text-coffee-700">
                    {t.section === "reading_writing" ? "R&W" : t.section === "math" ? "Math" : "—"}
                  </td>
                  <td className="py-3 px-5">
                    {t.visibility === "free" ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">Free</span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800">Premium</span>
                    )}
                  </td>
                  <td className="py-3 px-5">
                    {t.is_published ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">Published</span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-cream-200 text-coffee-700">Draft</span>
                    )}
                  </td>
                  <td className="py-3 px-5">
                    <Link href={`/admin/tests/${t.id}`} className="text-coffee-700 hover:text-coffee-900">
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
            No tests yet. Build your first module or full SAT test.
          </p>
          <Link
            href="/admin/tests/new"
            className="text-coffee-700 hover:text-coffee-900 underline text-sm"
          >
            Create a test
          </Link>
        </div>
      )}
    </div>
  );
}
