"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase-client";
import RichText from "@/components/RichText";

type Profile = { id: string; full_name: string | null; username: string | null };
type Conversation = { id: string; other: Profile; last_message?: string; unread: boolean };
type Message = {
  id: string; user_id: string; content: string; created_at: string;
  message_type: string; question_id?: number | null;
  shared_answer?: string | null; was_correct?: boolean | null;
  question?: { prompt: string; correct_answer: string } | null;
  profile?: { full_name: string | null };
};

export default function DirectMessages({ userId, onUnreadChange }: { userId: string; onUnreadChange: (n: number) => void }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const loadConversations = useCallback(async () => {
    const { data: memberRows } = await supabase
      .from("conversation_members")
      .select("conversation_id, last_read_at")
      .eq("user_id", userId);
    if (!memberRows || memberRows.length === 0) return;

    const convIds = memberRows.map((r) => r.conversation_id);
    const { data: convs } = await supabase
      .from("conversations")
      .select("id, type")
      .in("id", convIds)
      .eq("type", "dm")
      .order("updated_at", { ascending: false });
    if (!convs) return;

    const enriched: Conversation[] = [];
    for (const c of convs) {
      // Get the other member
      const { data: otherMember } = await supabase
        .from("conversation_members")
        .select("user_id")
        .eq("conversation_id", c.id)
        .neq("user_id", userId)
        .single();
      if (!otherMember) continue;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, username")
        .eq("id", otherMember.user_id)
        .single();

      // Get last message
      const { data: lastMsg } = await supabase
        .from("messages")
        .select("content, created_at")
        .eq("conversation_id", c.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const myRow = memberRows.find((r) => r.conversation_id === c.id);
      const hasUnread = lastMsg && myRow && new Date(lastMsg.created_at) > new Date(myRow.last_read_at ?? 0);

      enriched.push({
        id: c.id,
        other: profile ?? { id: otherMember.user_id, full_name: "Student", username: null },
        last_message: lastMsg?.content ?? undefined,
        unread: !!hasUnread,
      });
    }
    setConversations(enriched);
    onUnreadChange(enriched.filter((c) => c.unread).length);
  }, [userId, supabase, onUnreadChange]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  const openConversation = async (convId: string) => {
    setActiveConvId(convId);
    setMessages([]);

    // Mark as read
    await supabase
      .from("conversation_members")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", convId)
      .eq("user_id", userId);

    // Load messages
    const { data } = await supabase
      .from("messages")
      .select("id, user_id, content, created_at, message_type, question_id, shared_answer, was_correct, profile:profiles(full_name)")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });

    setMessages((data as Message[]) ?? []);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

    // Realtime subscription
    const channel = supabase
      .channel(`dm-${convId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${convId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  };

  const sendMessage = async () => {
    if (!draft.trim() || !activeConvId || sending) return;
    setSending(true);
    await supabase.from("messages").insert({
      user_id: userId,
      conversation_id: activeConvId,
      content: draft.trim(),
      channel: "dm",
      message_type: "text",
    });
    setDraft("");
    setSending(false);
    // Update conversation updated_at
    await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", activeConvId);
  };

  const activeConv = conversations.find((c) => c.id === activeConvId);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Conversation list */}
      <div className="w-64 border-r border-coffee-700/10 bg-cream-50 flex flex-col shrink-0 overflow-y-auto">
        <div className="p-4 text-xs font-medium text-coffee-600 uppercase tracking-wide border-b border-coffee-700/10">
          Direct Messages
        </div>
        {conversations.length === 0 ? (
          <div className="p-4 text-xs text-coffee-500">
            No DMs yet. Go to Friends → click DM next to a friend.
          </div>
        ) : (
          conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => openConversation(c.id)}
              className={`w-full text-left px-4 py-3 border-b border-coffee-700/5 hover:bg-cream-100 transition ${activeConvId === c.id ? "bg-cream-100" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm ${c.unread ? "font-semibold text-coffee-900" : "text-coffee-700"}`}>
                  {c.other.full_name ?? "Student"}
                </span>
                {c.unread && <span className="w-2 h-2 bg-red-500 rounded-full" />}
              </div>
              {c.other.username && <div className="text-xs text-coffee-500">@{c.other.username}</div>}
              {c.last_message && (
                <div className="text-xs text-coffee-500 truncate mt-0.5">{c.last_message}</div>
              )}
            </button>
          ))
        )}
      </div>

      {/* Message pane */}
      <div className="flex-1 flex flex-col overflow-hidden bg-cream-50">
        {!activeConvId ? (
          <div className="flex-1 flex items-center justify-center text-coffee-500 text-sm">
            Select a conversation to start chatting
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-5 py-3 border-b border-coffee-700/10 bg-cream-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-coffee-200 flex items-center justify-center text-coffee-800 font-semibold text-sm">
                {activeConv?.other.full_name?.[0] ?? "?"}
              </div>
              <div>
                <div className="text-sm font-semibold text-coffee-900">{activeConv?.other.full_name ?? "Student"}</div>
                {activeConv?.other.username && <div className="text-xs text-coffee-500">@{activeConv.other.username}</div>}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {messages.map((m) => {
                const isMe = m.user_id === userId;
                return (
                  <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${isMe ? "bg-coffee-800 text-cream-50" : "bg-cream-200 text-coffee-900"}`}>
                      {m.message_type === "question_share" ? (
                        <QuestionShareBubble m={m} isMe={isMe} />
                      ) : (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                      )}
                      <div className={`text-[10px] mt-1 ${isMe ? "text-cream-200" : "text-coffee-500"}`}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-5 py-3 border-t border-coffee-700/10 bg-cream-50">
              <div className="flex gap-3">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="Type a message…"
                  className="flex-1 bg-cream-100 border border-coffee-700/15 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-coffee-700/20"
                />
                <button
                  onClick={sendMessage}
                  disabled={!draft.trim() || sending}
                  className="bg-coffee-800 hover:bg-coffee-900 text-cream-50 px-4 py-2.5 rounded-full text-sm font-medium disabled:opacity-40"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function QuestionShareBubble({ m, isMe }: { m: Message; isMe: boolean }) {
  return (
    <div className={`rounded-xl p-3 text-sm space-y-2 border ${isMe ? "border-cream-50/20 bg-coffee-700/30" : "border-coffee-700/15 bg-cream-50"}`}>
      <div className="flex items-center gap-1.5">
        <span className="text-base">📝</span>
        <span className={`text-xs font-semibold ${isMe ? "text-cream-200" : "text-coffee-600"}`}>Shared a question</span>
        {m.was_correct != null && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.was_correct ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {m.was_correct ? "✓ Got it right" : "✗ Got it wrong"}
          </span>
        )}
      </div>
      <p className={`text-xs leading-relaxed line-clamp-4 ${isMe ? "text-cream-100" : "text-coffee-800"}`}>{m.content}</p>
      {m.shared_answer && (
        <div className={`text-xs ${isMe ? "text-cream-200" : "text-coffee-600"}`}>Their answer: <strong>({m.shared_answer})</strong></div>
      )}
    </div>
  );
}
