"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";

type VocabList = {
  id: number;
  title: string;
  description: string | null;
  is_published: boolean;
  position: number;
};

export default function VocabAdminView({
  lists: initialLists,
  counts: initialCounts,
}: {
  lists: VocabList[];
  counts: Record<number, number>;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [lists, setLists] = useState<VocabList[]>(initialLists);
  const [counts, setCounts] = useState<Record<number, number>>(initialCounts);

  // New list form
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  // Bulk import
  const [importListId, setImportListId] = useState<number | "">("");
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ added: number; skipped: number; errors: string[] } | null>(null);

  const createList = async () => {
    const t = newTitle.trim();
    if (!t) return;
    setCreating(true);
    const maxPos = Math.max(0, ...lists.map((l) => l.position ?? 0));
    const { data, error } = await supabase
      .from("vocab_lists")
      .insert({
        title: t,
        description: newDesc.trim() || null,
        position: maxPos + 1,
        is_published: true,
      })
      .select()
      .single();
    setCreating(false);
    if (error) {
      alert("Could not create: " + error.message);
      return;
    }
    if (data) {
      setLists([...lists, data as VocabList]);
      setCounts({ ...counts, [data.id]: 0 });
      setNewTitle("");
      setNewDesc("");
    }
  };

  const togglePublish = async (id: number, current: boolean) => {
    await supabase.from("vocab_lists").update({ is_published: !current }).eq("id", id);
    setLists(lists.map((l) => (l.id === id ? { ...l, is_published: !current } : l)));
  };

  const deleteList = async (id: number) => {
    if (!confirm("Delete this list and all its words? Students' saved-from-this-list copies stay.")) return;
    await supabase.from("vocab_lists").delete().eq("id", id);
    setLists(lists.filter((l) => l.id !== id));
  };

  const parseImport = (text: string) => {
    // Accepts lines like:
    //   word | part of speech | definition | example
    //   word | definition
    //   word - definition
    //   word: definition
    // We split on the first separator we find from this priority list.
    const rows: Array<{ word: string; pos: string; def: string; ex: string }> = [];
    const errors: string[] = [];
    const lines = text.split(/\r?\n/);
    lines.forEach((rawLine, lineIdx) => {
      const line = rawLine.trim();
      if (!line || line.startsWith("#") || line.startsWith("//")) return;
      let parts: string[] = [];
      if (line.includes("|")) parts = line.split("|").map((s) => s.trim());
      else if (line.includes("\t")) parts = line.split("\t").map((s) => s.trim());
      else if (line.includes(" - ")) parts = line.split(" - ").map((s) => s.trim());
      else if (line.includes(":")) {
        const idx = line.indexOf(":");
        parts = [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
      } else {
        errors.push(`Line ${lineIdx + 1}: couldn't parse "${line.slice(0, 40)}…"`);
        return;
      }
      const word = parts[0]?.replace(/[*\-•\d.]+\s*/, "").trim();
      if (!word) {
        errors.push(`Line ${lineIdx + 1}: missing word`);
        return;
      }
      let pos = "";
      let def = "";
      let ex = "";
      if (parts.length === 4) {
        [, pos, def, ex] = parts;
      } else if (parts.length === 3) {
        [, def, ex] = parts;
      } else {
        def = parts[1] ?? "";
      }
      if (!def) {
        errors.push(`Line ${lineIdx + 1}: "${word}" has no definition`);
        return;
      }
      rows.push({ word: word.toLowerCase(), pos, def, ex });
    });
    return { rows, errors };
  };

  const runImport = async () => {
    if (!importListId || !importText.trim()) return;
    setImporting(true);
    setImportResult(null);

    const { rows, errors } = parseImport(importText);
    let added = 0;
    let skipped = 0;
    for (const r of rows) {
      const { error } = await supabase
        .from("vocab_words")
        .insert({
          list_id: importListId,
          word: r.word,
          part_of_speech: r.pos || null,
          definition: r.def,
          example: r.ex || null,
        });
      if (error) {
        skipped++;
        errors.push(`"${r.word}": ${error.message}`);
      } else {
        added++;
      }
    }
    setImportResult({ added, skipped, errors });
    setCounts({ ...counts, [importListId as number]: (counts[importListId as number] ?? 0) + added });
    setImporting(false);
    if (added > 0) setImportText("");
  };

  return (
    <div className="p-10 max-w-5xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-coffee-900">Vocabulary</h1>
        <p className="text-coffee-600 mt-1">
          Manage word lists. Bulk-import your own content via paste.
        </p>
      </div>

      {/* IP notice */}
      <div className="bg-cream-100 border border-coffee-700/10 rounded-2xl p-5 mb-8">
        <div className="flex items-start gap-3">
          <div className="text-xl shrink-0">⚠️</div>
          <div className="text-sm text-coffee-700 leading-relaxed">
            <div className="font-medium text-coffee-900 mb-1">Use original or licensed content</div>
            <p>
              Only paste words from sources you have rights to use: your own notes, public-domain lists,
              or content you've personally authored. Don't bulk-paste copyrighted lists (e.g. published prep
              books) into a commercial app — that's infringement even when typed by hand.
              The 400-word seed list ships clean.
            </p>
          </div>
        </div>
      </div>

      {/* ===== LISTS ===== */}
      <div className="mb-10">
        <h2 className="font-display text-xl font-semibold text-coffee-900 mb-4">Lists</h2>
        <div className="space-y-2 mb-5">
          {lists.length === 0 ? (
            <div className="bg-cream-50 border border-coffee-700/10 rounded-2xl p-6 text-center text-sm text-coffee-600">
              No lists yet. Create one below.
            </div>
          ) : (
            lists.map((l) => (
              <div
                key={l.id}
                className="bg-cream-50 border border-coffee-700/10 rounded-2xl p-4 flex items-center gap-4"
              >
                <div className="text-2xl shrink-0">📘</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-coffee-900">{l.title}</div>
                  <div className="text-xs text-coffee-500">
                    {counts[l.id] ?? 0} words · {l.is_published ? "Published" : "Hidden"}
                  </div>
                </div>
                <button
                  onClick={() => togglePublish(l.id, l.is_published)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                    l.is_published
                      ? "bg-green-100 text-green-700"
                      : "bg-cream-200 text-coffee-700"
                  }`}
                >
                  {l.is_published ? "✓ Published" : "Hidden"}
                </button>
                <button
                  onClick={() => deleteList(l.id)}
                  className="text-xs text-red-600 hover:text-red-800 px-3 py-1.5"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>

        {/* New list form */}
        <div className="bg-cream-50 border border-dashed border-coffee-700/20 rounded-2xl p-5">
          <div className="text-sm font-medium text-coffee-900 mb-3">Create a new list</div>
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="List title (e.g. Science Roots)"
            />
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Short description (optional)"
            />
          </div>
          <button
            onClick={createList}
            disabled={creating || !newTitle.trim()}
            className="bg-coffee-800 text-cream-50 px-5 py-2 rounded-full text-sm font-medium hover:scale-[1.02] transition disabled:opacity-50"
          >
            {creating ? "Creating…" : "+ Create list"}
          </button>
        </div>
      </div>

      {/* ===== BULK IMPORT ===== */}
      <div>
        <h2 className="font-display text-xl font-semibold text-coffee-900 mb-1">Bulk import words</h2>
        <p className="text-sm text-coffee-600 mb-4">
          Paste one word per line. Supported formats:
        </p>
        <div className="bg-coffee-900 text-cream-100 rounded-2xl p-4 text-xs font-mono mb-4 space-y-1">
          <div><span className="text-accent">word</span> | <span className="text-cream-200/70">pos</span> | <span className="text-cream-200/70">definition</span> | <span className="text-cream-200/70">example</span></div>
          <div><span className="text-accent">word</span> | <span className="text-cream-200/70">definition</span></div>
          <div><span className="text-accent">word</span> - <span className="text-cream-200/70">definition</span></div>
          <div><span className="text-accent">word</span>: <span className="text-cream-200/70">definition</span></div>
        </div>

        <div className="mb-3">
          <label>Target list</label>
          <select
            value={importListId}
            onChange={(e) => setImportListId(e.target.value ? parseInt(e.target.value) : "")}
          >
            <option value="">— select a list —</option>
            {lists.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label>Paste your words below</label>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={10}
            placeholder={`abate | verb | to lessen in intensity | The storm finally abated.\naberration: a departure from the norm\nadamant - refusing to be persuaded`}
            style={{ fontFamily: "monospace", fontSize: 13 }}
          />
        </div>

        <button
          onClick={runImport}
          disabled={importing || !importListId || !importText.trim()}
          className="bg-coffee-800 text-cream-50 px-5 py-2.5 rounded-full text-sm font-medium hover:scale-[1.02] transition disabled:opacity-50"
        >
          {importing ? "Importing…" : "→ Import words"}
        </button>

        {importResult && (
          <div className="mt-5 bg-cream-50 border border-coffee-700/10 rounded-2xl p-5">
            <div className="font-medium text-coffee-900 mb-2">Result</div>
            <div className="text-sm text-coffee-700 mb-2">
              ✓ {importResult.added} added · ✗ {importResult.skipped} skipped
            </div>
            {importResult.errors.length > 0 && (
              <details>
                <summary className="text-xs text-coffee-600 cursor-pointer hover:text-coffee-900">
                  Show errors ({importResult.errors.length})
                </summary>
                <ul className="text-xs text-coffee-600 mt-2 space-y-1 max-h-40 overflow-y-auto">
                  {importResult.errors.slice(0, 50).map((e, i) => (
                    <li key={i} className="font-mono">{e}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
