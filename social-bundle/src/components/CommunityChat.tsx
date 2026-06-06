"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase-client";

type Channel = {
  id: number;
  name: string;
  description: string | null;
  emoji: string;
};

type Message = {
  id: number;
  channel_id: number;
  user_id: string;
  author_name: string;
  content: string;
  created_at: string;
  message_type?: string;
  shared_answer?: string | null;
  was_correct?: boolean | null;
};

// All props are now optional — component fetches its own data when not provided.
export default function CommunityChat({
  channels: propChannels,
  initialChannelId,
  initialMessages,
  currentUserId: propUserId,
  currentUserName: propUserName,
}: {
  channels?: Channel[];
  initialChannelId?: number;
  initialMessages?: Message[];
  currentUserId?: string;
  currentUserName?: string;
} = {}) {
  const supabase = createClient();

  const [channels, setChannels] = useState<Channel[]>(propChannels ?? []);
  const [activeChannelId, setActiveChannelId] = useState<number>(initialChannelId ?? 0);
  const [messages, setMessages] = useState<Message[]>(initialMessages ?? []);
  const [currentUserId, setCurrentUserId] = useState(propUserId ?? "");
  const [currentUserName, setCurrentUserName] = useState(propUserName ?? "");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(!propChannels);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const activeChannel = channels.find((c) => c.id === activeChannelId);

  // Self-load when no props provided (used inside /app/messages)
  useEffect(() => {
    if (propChannels && propUserId) return; // already have everything

    const load = async () => {
      setLoading(true);
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        setCurrentUserName(profile?.full_name ?? user.email ?? "Student");
      }

      // Load channels
      const { data: channelData } = await supabase
        .from("channels")
        .select("*")
        .order("id", { ascending: true });

      if (channelData && channelData.length > 0) {
        setChannels(channelData);
        const firstId = channelData[0].id;
        setActiveChannelId(firstId);

        // Load messages for first channel
        const { data: msgData } = await supabase
          .from("messages")
          .select("id, channel_id, user_id, author_name, content, created_at, message_type, shared_answer, was_correct")
          .eq("channel_id", firstId)
          .order("created_at", { ascending: true })
          .limit(100);
        setMessages(msgData ?? []);
      }
      setLoading(false);
    };

    load();
  }, [propChannels, propUserId, supabase]);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const loadChannel = async (channelId: number) => {
    setActiveChannelId(channelId);
    setLoading(true);
    setError(null);
    const { data, error: loadError } = await supabase
      .from("messages")
      .select("id, channel_id, user_id, author_name, content, created_at, message_type, shared_answer, was_correct")
      .eq("channel_id", channelId)
      .order("created_at", { ascending: true })
      .limit(100);
    if (loadError) {
      setError("Could not load messages.");
    } else {
      setMessages(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!activeChannelId) return;
    const channel = supabase
      .channel(`messages-${activeChannelId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `channel_id=eq.${activeChannelId}` },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "messages", filter: `channel_id=eq.${activeChannelId}` },
        (payload) => {
          const deletedId = (payload.old as { id: number }).id;
          setMessages((prev) => prev.filter((m) => m.id !== deletedId));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeChannelId, supabase]);

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || !currentUserId) return;
    setSending(true);
    setError(null);

    const { data, error: sendError } = await supabase
      .from("messages")
      .insert({
        channel_id: activeChannelId,
        user_id: currentUserId,
        author_name: currentUserName,
        content: text,
      })
      .select()
      .single();

    if (sendError) {
      setError("Could not send: " + sendError.message);
      setSending(false);
      return;
    }

    if (data) {
      setMessages((prev) =>
        prev.some((m) => m.id === data.id) ? prev : [...prev, data as Message]
      );
    }
    setDraft("");
    setSending(false);
  };

  const deleteMessage = async (messageId: number) => {
    await supabase.from("messages").delete().eq("id", messageId);
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const fmtTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  if (loading && channels.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-coffee-600 text-sm">
        Loading community…
      </div>
    );
  }

  return (
    <div className="flex" style={{ height: "calc(100vh - 65px)" }}>
      {/* Channels sidebar */}
      <div className="w-56 bg-cream-100 border-r border-coffee-700/10 flex flex-col">
        <div className="p-4 border-b border-coffee-700/10">
          <h2 className="font-display font-semibold text-coffee-900">Community</h2>
          <p className="text-xs text-coffee-600 mt-0.5">Channels</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {channels.map((c) => (
            <button
              key={c.id}
              onClick={() => loadChannel(c.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                c.id === activeChannelId
                  ? "bg-coffee-800 text-cream-50 font-medium"
                  : "text-coffee-700 hover:bg-cream-200"
              }`}
            >
              <span className="mr-2">{c.emoji}</span>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-cream-50">
        <div className="px-6 py-4 border-b border-coffee-700/10">
          <h1 className="font-display font-semibold text-lg text-coffee-900">
            {activeChannel?.emoji} {activeChannel?.name}
          </h1>
          {activeChannel?.description && (
            <p className="text-xs text-coffee-600">{activeChannel.description}</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {loading ? (
            <div className="text-center text-coffee-600 text-sm py-8">Loading messages…</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-coffee-600 text-sm py-8">
              No messages yet. Be the first to say something! 👋
            </div>
          ) : (
            messages.map((m) => {
              const mine = m.user_id === currentUserId;
              return (
                <div key={m.id} className="group flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-coffee-700 text-cream-50 grid place-items-center font-display font-semibold text-sm shrink-0">
                    {m.author_name[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-medium text-coffee-900 text-sm">
                        {m.author_name}
                        {mine && <span className="text-coffee-500 font-normal"> (you)</span>}
                      </span>
                      <span className="text-xs text-coffee-500">{fmtTime(m.created_at)}</span>
                      {mine && (
                        <button
                          onClick={() => deleteMessage(m.id)}
                          className="text-xs text-red-600 hover:text-red-800 opacity-0 group-hover:opacity-100 transition"
                        >
                          delete
                        </button>
                      )}
                    </div>
                    <div className="text-coffee-800 text-sm whitespace-pre-wrap break-words">
                      {m.message_type === "question_share" ? (
                        <div className="bg-cream-100 border border-coffee-700/10 rounded-xl p-3 space-y-1.5 mt-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>📝</span>
                            <span className="text-xs font-semibold text-coffee-700">Shared a question</span>
                            {m.was_correct != null && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                m.was_correct ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }`}>
                                {m.was_correct ? "✓ Got it right" : "✗ Got it wrong"}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-coffee-800 leading-relaxed line-clamp-4">{m.content}</p>
                          {m.shared_answer && (
                            <p className="text-xs text-coffee-600">Their answer: <strong>({m.shared_answer})</strong></p>
                          )}
                        </div>
                      ) : (
                        m.content
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {error && (
          <div className="px-6 py-2 text-sm text-red-700 bg-red-50 border-t border-red-200">
            {error}
          </div>
        )}

        <div className="border-t border-coffee-700/10 p-4">
          <div className="flex gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${activeChannel?.name ?? ""}…`}
              rows={1}
              className="flex-1 resize-none"
              style={{ minHeight: "44px", maxHeight: "120px" }}
            />
            <button
              onClick={sendMessage}
              disabled={sending || !draft.trim()}
              className="bg-coffee-800 hover:bg-coffee-900 disabled:opacity-40 text-cream-50 px-5 rounded-xl text-sm font-medium"
            >
              {sending ? "…" : "Send"}
            </button>
          </div>
          <p className="text-xs text-coffee-500 mt-1.5">
            Press Enter to send · Shift+Enter for a new line · Be kind 🤝
          </p>
        </div>
      </div>
    </div>
  );
}
