"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase-client";

type Profile = { id: string; full_name: string | null; username: string | null };
type GroupConv = { id: string; name: string | null; members: Profile[]; unread: boolean; last_message?: string };
type Message = { id: string; user_id: string; content: string; created_at: string; message_type: string; shared_answer?: string | null; was_correct?: boolean | null; profile?: { full_name: string | null } };

export default function GroupChats({ userId, onUnreadChange }: { userId: string; onUnreadChange: (n: number) => void }) {
  const [groups, setGroups] = useState<GroupConv[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [friends, setFriends] = useState<Profile[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const loadGroups = useCallback(async () => {
    const { data: memberRows } = await supabase
      .from("conversation_members")
      .select("conversation_id, last_read_at")
      .eq("user_id", userId);
    if (!memberRows || memberRows.length === 0) return;

    const convIds = memberRows.map((r) => r.conversation_id);
    const { data: convs } = await supabase
      .from("conversations")
      .select("id, name, type")
      .in("id", convIds)
      .eq("type", "group")
      .order("updated_at", { ascending: false });
    if (!convs) return;

    const enriched: GroupConv[] = [];
    for (const c of convs) {
      const { data: memberData } = await supabase
        .from("conversation_members")
        .select("user_id")
        .eq("conversation_id", c.id);

      const memberIds = memberData?.map((m) => m.user_id) ?? [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, username")
        .in("id", memberIds.length > 0 ? memberIds : ["00000000-0000-0000-0000-000000000000"]);

      const { data: lastMsg } = await supabase
        .from("messages")
        .select("content, created_at")
        .eq("conversation_id", c.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const myRow = memberRows.find((r) => r.conversation_id === c.id);
      const hasUnread = lastMsg && myRow && new Date(lastMsg.created_at) > new Date(myRow.last_read_at ?? 0);

      enriched.push({
        id: c.id,
        name: c.name,
        members: (profiles ?? []) as Profile[],
        unread: !!hasUnread,
        last_message: lastMsg?.content ?? undefined,
      });
    }
    setGroups(enriched);
    onUnreadChange(enriched.filter((g) => g.unread).length);
  }, [userId, supabase, onUnreadChange]);

  // Load friends for the group creator
  const loadFriends = useCallback(async () => {
    const { data } = await supabase
      .from("friendships")
      .select("requester, recipient")
      .or(`requester.eq.${userId},recipient.eq.${userId}`)
      .eq("status", "accepted");
    if (!data) return;

    const otherIds = data.map((f) => f.requester === userId ? f.recipient : f.requester);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, username")
      .in("id", otherIds.length > 0 ? otherIds : ["00000000-0000-0000-0000-000000000000"]);
    setFriends((profiles ?? []) as Profile[]);
  }, [userId, supabase]);

  useEffect(() => { loadGroups(); loadFriends(); }, [loadGroups, loadFriends]);

  const openGroup = async (groupId: string) => {
    setActiveGroupId(groupId);
    setMessages([]);

    await supabase
      .from("conversation_members")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", groupId)
      .eq("user_id", userId);

    const { data } = await supabase
      .from("messages")
      .select("id, user_id, content, created_at, message_type, shared_answer, was_correct, profile:profiles(full_name)")
      .eq("conversation_id", groupId)
      .order("created_at", { ascending: true });

    setMessages((data as Message[]) ?? []);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

    const channel = supabase
      .channel(`group-${groupId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${groupId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  };

  const sendMessage = async () => {
    if (!draft.trim() || !activeGroupId || sending) return;
    setSending(true);
    await supabase.from("messages").insert({
      user_id: userId,
      conversation_id: activeGroupId,
      content: draft.trim(),
      channel: "group",
      message_type: "text",
    });
    setDraft("");
    setSending(false);
    await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", activeGroupId);
  };

  const createGroup = async () => {
    if (!newGroupName.trim() || creating) return;
    setCreating(true);

    const { data: conv } = await supabase
      .from("conversations")
      .insert({ type: "group", name: newGroupName.trim(), created_by: userId })
      .select("id")
      .single();

    if (conv) {
      const members = [userId, ...selectedFriends];
      await supabase.from("conversation_members").insert(
        members.map((uid) => ({ conversation_id: conv.id, user_id: uid }))
      );
      setShowCreate(false);
      setNewGroupName("");
      setSelectedFriends([]);
      loadGroups();
      openGroup(conv.id);
    }
    setCreating(false);
  };

  const activeGroup = groups.find((g) => g.id === activeGroupId);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Group list */}
      <div className="w-64 border-r border-coffee-700/10 bg-cream-50 flex flex-col shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-coffee-700/10 flex items-center justify-between">
          <span className="text-xs font-medium text-coffee-600 uppercase tracking-wide">Groups</span>
          <button
            onClick={() => setShowCreate(true)}
            className="text-xs bg-accent text-cream-50 px-2.5 py-1 rounded-full hover:bg-accent/90"
          >
            + New
          </button>
        </div>

        {groups.length === 0 ? (
          <div className="p-4 text-xs text-coffee-500">No groups yet. Create one above.</div>
        ) : (
          groups.map((g) => (
            <button
              key={g.id}
              onClick={() => openGroup(g.id)}
              className={`w-full text-left px-4 py-3 border-b border-coffee-700/5 hover:bg-cream-100 transition ${activeGroupId === g.id ? "bg-cream-100" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm ${g.unread ? "font-semibold text-coffee-900" : "text-coffee-700"}`}>
                  {g.name ?? "Group"}
                </span>
                {g.unread && <span className="w-2 h-2 bg-red-500 rounded-full" />}
              </div>
              <div className="text-xs text-coffee-500">{g.members.length} members</div>
              {g.last_message && <div className="text-xs text-coffee-400 truncate mt-0.5">{g.last_message}</div>}
            </button>
          ))
        )}
      </div>

      {/* Chat pane */}
      <div className="flex-1 flex flex-col overflow-hidden bg-cream-50">
        {showCreate ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="bg-cream-100 rounded-3xl p-6 max-w-sm w-full shadow-sm space-y-4">
              <h3 className="font-display text-xl font-semibold text-coffee-900">Create a group</h3>
              <label className="block">
                <span className="text-xs text-coffee-600 uppercase tracking-wide font-medium">Group name</span>
                <input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. SAT Study Squad"
                  className="mt-1 w-full bg-cream-50 border border-coffee-700/15 rounded-xl px-3 py-2 text-sm"
                />
              </label>
              <div>
                <div className="text-xs text-coffee-600 uppercase tracking-wide font-medium mb-2">Add friends</div>
                {friends.length === 0 ? (
                  <p className="text-xs text-coffee-500">Add friends first to include them in groups.</p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {friends.map((f) => (
                      <label key={f.id} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-cream-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedFriends.includes(f.id)}
                          onChange={(e) => setSelectedFriends((prev) =>
                            e.target.checked ? [...prev, f.id] : prev.filter((id) => id !== f.id)
                          )}
                          className="accent-coffee-800"
                        />
                        <span className="text-sm text-coffee-900">{f.full_name ?? "Student"}</span>
                        {f.username && <span className="text-xs text-coffee-500">@{f.username}</span>}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={createGroup}
                  disabled={!newGroupName.trim() || creating}
                  className="flex-1 bg-coffee-800 text-cream-50 text-sm py-2.5 rounded-full hover:bg-coffee-900 disabled:opacity-40"
                >
                  {creating ? "Creating…" : "Create group"}
                </button>
                <button onClick={() => setShowCreate(false)} className="px-4 text-sm text-coffee-600 hover:text-coffee-900">Cancel</button>
              </div>
            </div>
          </div>
        ) : !activeGroupId ? (
          <div className="flex-1 flex items-center justify-center text-coffee-500 text-sm">
            Select a group or create a new one
          </div>
        ) : (
          <>
            <div className="px-5 py-3 border-b border-coffee-700/10 bg-cream-100">
              <div className="font-semibold text-coffee-900 text-sm">{activeGroup?.name ?? "Group"}</div>
              <div className="text-xs text-coffee-500">
                {activeGroup?.members.map((m) => m.full_name ?? "Student").join(", ")}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {messages.map((m) => {
                const isMe = m.user_id === userId;
                const senderName = m.profile?.full_name ?? "Student";
                return (
                  <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[70%]">
                      {!isMe && <div className="text-xs text-coffee-600 mb-1 ml-1">{senderName}</div>}
                      <div className={`rounded-2xl px-4 py-2.5 ${isMe ? "bg-coffee-800 text-cream-50" : "bg-cream-200 text-coffee-900"}`}>
                        {m.message_type === "question_share" ? (
                          <div className="text-xs space-y-1">
                            <div className="font-semibold">📝 Shared a question</div>
                            <p className="line-clamp-3 opacity-90">{m.content}</p>
                            {m.was_correct != null && (
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${m.was_correct ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}>
                                {m.was_correct ? "✓ Correct" : "✗ Wrong"}
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                        )}
                        <div className={`text-[10px] mt-1 ${isMe ? "text-cream-200" : "text-coffee-500"}`}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

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
