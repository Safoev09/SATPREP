"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";

const CHANNELS = [
  { id: "general", label: "💬 General" },
  { id: "math_help", label: "📐 Math Help" },
  { id: "rw_help", label: "📖 R&W Help" },
  { id: "motivation", label: "🔥 Motivation" },
];

type Props = {
  questionPrompt: string;   // The passage + question text
  questionId: number;
  selectedAnswer: string;   // A / B / C / D
  wasCorrect: boolean;
  onClose: () => void;
};

type Conversation = { id: string; label: string; type: "dm" | "group" };

export default function ShareQuestionModal({ questionPrompt, questionId, selectedAnswer, wasCorrect, onClose }: Props) {
  const [mode, setMode] = useState<"community" | "dm_group">("community");
  const [channel, setChannel] = useState("general");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [sharing, setSharing] = useState(false);
  const [done, setDone] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      setUserId(data.user.id);

      // Load DMs + groups for this user
      supabase
        .from("conversation_members")
        .select("conversation_id")
        .eq("user_id", data.user.id)
        .then(async ({ data: memberRows }) => {
          if (!memberRows || memberRows.length === 0) return;
          const ids = memberRows.map((r) => r.conversation_id);
          const { data: convs } = await supabase
            .from("conversations")
            .select("id, type, name")
            .in("id", ids)
            .order("updated_at", { ascending: false });
          if (!convs) return;

          const enriched: Conversation[] = [];
          for (const c of convs) {
            if (c.type === "dm") {
              // Get the other user's name
              const { data: other } = await supabase
                .from("conversation_members")
                .select("user_id")
                .eq("conversation_id", c.id)
                .neq("user_id", data.user!.id)
                .single();
              if (other) {
                const { data: prof } = await supabase
                  .from("profiles")
                  .select("full_name, username")
                  .eq("id", other.user_id)
                  .single();
                enriched.push({
                  id: c.id,
                  label: `✉️ ${prof?.full_name ?? "DM"}${prof?.username ? ` (@${prof.username})` : ""}`,
                  type: "dm",
                });
              }
            } else {
              enriched.push({ id: c.id, label: `👥 ${c.name ?? "Group"}`, type: "group" });
            }
          }
          setConversations(enriched);
        });
    });
  }, []);

  const share = async () => {
    if (!userId || sharing) return;
    setSharing(true);

    // Build a readable snippet of the question (first 400 chars)
    const snippet = questionPrompt.length > 400
      ? questionPrompt.slice(0, 397) + "…"
      : questionPrompt;
    const content = note.trim() ? `${snippet}\n\n💬 ${note}` : snippet;

    if (mode === "community") {
      await supabase.from("messages").insert({
        user_id: userId,
        channel,
        content,
        message_type: "question_share",
        question_id: questionId,
        shared_answer: selectedAnswer,
        was_correct: wasCorrect,
      });
    } else if (selectedConvId) {
      await supabase.from("messages").insert({
        user_id: userId,
        conversation_id: selectedConvId,
        channel: "dm",
        content,
        message_type: "question_share",
        question_id: questionId,
        shared_answer: selectedAnswer,
        was_correct: wasCorrect,
      });
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", selectedConvId);
    }

    setSharing(false);
    setDone(true);
    setTimeout(onClose, 1200);
  };

  const canShare = mode === "community" || (mode === "dm_group" && selectedConvId);

  return (
    <div className="fixed inset-0 z-50 bg-coffee-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-cream-50 rounded-3xl max-w-lg w-full p-6 shadow-2xl">
        {done ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">✅</div>
            <div className="font-display text-xl font-semibold text-coffee-900">Shared!</div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-display text-xl font-semibold text-coffee-900">Share this question</h2>
                <p className="text-sm text-coffee-600 mt-0.5">
                  You answered <strong>({selectedAnswer})</strong> — {wasCorrect ? "✓ correct" : "✗ wrong"}
                </p>
              </div>
              <button onClick={onClose} className="text-coffee-500 hover:text-coffee-900 text-2xl px-2">×</button>
            </div>

            {/* Question preview */}
            <div className="bg-cream-100 rounded-xl p-3 text-xs text-coffee-700 line-clamp-3 mb-4 leading-relaxed">
              {questionPrompt.slice(0, 240)}{questionPrompt.length > 240 ? "…" : ""}
            </div>

            {/* Destination toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setMode("community")}
                className={`flex-1 py-2 rounded-full text-sm font-medium transition ${mode === "community" ? "bg-coffee-800 text-cream-50" : "bg-cream-100 text-coffee-700 hover:bg-cream-200"}`}
              >
                Community channel
              </button>
              <button
                onClick={() => setMode("dm_group")}
                className={`flex-1 py-2 rounded-full text-sm font-medium transition ${mode === "dm_group" ? "bg-coffee-800 text-cream-50" : "bg-cream-100 text-coffee-700 hover:bg-cream-200"}`}
              >
                DM or Group
              </button>
            </div>

            {mode === "community" && (
              <div className="mb-4">
                <div className="text-xs text-coffee-600 uppercase tracking-wide font-medium mb-2">Pick a channel</div>
                <div className="grid grid-cols-2 gap-2">
                  {CHANNELS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setChannel(c.id)}
                      className={`py-2.5 rounded-xl text-sm transition ${channel === c.id ? "bg-coffee-800 text-cream-50" : "bg-cream-100 text-coffee-700 hover:bg-cream-200"}`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mode === "dm_group" && (
              <div className="mb-4">
                <div className="text-xs text-coffee-600 uppercase tracking-wide font-medium mb-2">Pick a conversation</div>
                {conversations.length === 0 ? (
                  <p className="text-xs text-coffee-500 bg-cream-100 rounded-xl p-3">
                    No DMs or groups yet. Add friends first from the Messages page.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {conversations.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedConvId(c.id)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-sm transition ${selectedConvId === c.id ? "bg-coffee-800 text-cream-50" : "bg-cream-100 text-coffee-700 hover:bg-cream-200"}`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Optional note */}
            <div className="mb-4">
              <div className="text-xs text-coffee-600 uppercase tracking-wide font-medium mb-1.5">Add a note (optional)</div>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. I got confused on this one…"
                className="w-full bg-cream-100 border border-coffee-700/15 rounded-xl px-3 py-2 text-sm"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={share}
                disabled={!canShare || sharing}
                className="flex-1 bg-coffee-800 hover:bg-coffee-900 text-cream-50 font-medium py-2.5 rounded-full text-sm disabled:opacity-40"
              >
                {sharing ? "Sharing…" : "Share →"}
              </button>
              <button onClick={onClose} className="px-4 text-sm text-coffee-600 hover:text-coffee-900">Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
