"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase-client";

type Profile = { id: string; full_name: string | null; username: string | null; friend_id: string | null; avatar_url?: string | null };
type Friendship = { id: string; requester: string; recipient: string; status: string; other: Profile };

export default function FriendPanel({ userId, onStartDM }: { userId: string; onStartDM: () => void }) {
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState<Profile | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [pending, setPending] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const loadFriends = useCallback(async () => {
    const { data } = await supabase
      .from("friendships")
      .select("id, requester, recipient, status")
      .or(`requester.eq.${userId},recipient.eq.${userId}`);

    if (!data) { setLoading(false); return; }

    const otherIds = data.map((f) => f.requester === userId ? f.recipient : f.requester);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, username, friend_id")
      .in("id", otherIds.length > 0 ? otherIds : ["00000000-0000-0000-0000-000000000000"]);

    const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
    const enriched = data.map((f) => {
      const otherId = f.requester === userId ? f.recipient : f.requester;
      return { ...f, other: profileMap[otherId] ?? { id: otherId, full_name: "Unknown", username: null, friend_id: null } };
    });

    setFriends(enriched.filter((f) => f.status === "accepted"));
    setPending(enriched.filter((f) => f.status === "pending" && f.recipient === userId));
    setLoading(false);
  }, [userId, supabase]);

  useEffect(() => { loadFriends(); }, [loadFriends]);

  const doSearch = async () => {
    const q = search.trim();
    if (!q) return;
    setSearching(true);
    setSearchError(null);
    setSearchResult(null);

    const isId = q.startsWith("#");
    const query = isId
      ? supabase.from("profiles").select("id, full_name, username, friend_id").eq("friend_id", q.slice(1)).single()
      : supabase.from("profiles").select("id, full_name, username, friend_id").eq("username", q.startsWith("@") ? q.slice(1) : q).single();

    const { data, error } = await query;
    setSearching(false);
    if (error || !data) { setSearchError("No user found with that username or ID."); return; }
    if (data.id === userId) { setSearchError("That's you!"); return; }
    setSearchResult(data);
  };

  const sendRequest = async (toId: string) => {
    await supabase.from("friendships").insert({ requester: userId, recipient: toId, status: "pending" });
    setSearchResult(null);
    setSearch("");
    loadFriends();
  };

  const respond = async (friendshipId: string, accept: boolean) => {
    await supabase.from("friendships").update({ status: accept ? "accepted" : "declined" }).eq("id", friendshipId);
    loadFriends();
  };

  const startDM = async (friendId: string) => {
    const { data } = await supabase.rpc("get_or_create_dm", { user_a: userId, user_b: friendId });
    if (data) onStartDM();
  };

  const alreadyFriend = (id: string) =>
    friends.some((f) => f.other.id === id) || pending.some((f) => f.other.id === id);

  return (
    <div className="mt-2 space-y-4">
      {/* Search */}
      <div>
        <div className="text-xs font-medium text-coffee-600 uppercase tracking-wide mb-1.5">Find a student</div>
        <div className="flex gap-1.5">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSearch()}
            placeholder="@username or #123456"
            className="flex-1 bg-cream-100 border border-coffee-700/15 rounded-lg px-2.5 py-1.5 text-xs"
          />
          <button
            onClick={doSearch}
            disabled={searching}
            className="bg-coffee-800 text-cream-50 text-xs px-2.5 py-1.5 rounded-lg hover:bg-coffee-900 disabled:opacity-50"
          >
            {searching ? "…" : "Go"}
          </button>
        </div>
        {searchError && <p className="text-xs text-red-600 mt-1">{searchError}</p>}
        {searchResult && (
          <div className="mt-2 bg-cream-100 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-coffee-900">{searchResult.full_name ?? "Student"}</div>
              <div className="text-xs text-coffee-600">
                {searchResult.username ? `@${searchResult.username}` : ""} {searchResult.friend_id ? `#${searchResult.friend_id}` : ""}
              </div>
            </div>
            {alreadyFriend(searchResult.id) ? (
              <span className="text-xs text-coffee-500 italic">Already connected</span>
            ) : (
              <button
                onClick={() => sendRequest(searchResult!.id)}
                className="bg-accent text-cream-50 text-xs px-3 py-1.5 rounded-full hover:bg-accent/90"
              >
                Add friend
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pending requests */}
      {pending.length > 0 && (
        <div>
          <div className="text-xs font-medium text-coffee-600 uppercase tracking-wide mb-1.5">
            Friend requests ({pending.length})
          </div>
          <div className="space-y-1.5">
            {pending.map((f) => (
              <div key={f.id} className="bg-cream-100 rounded-xl p-2.5">
                <div className="text-sm font-medium text-coffee-900">{f.other.full_name ?? "Student"}</div>
                <div className="text-xs text-coffee-600 mb-2">
                  {f.other.username ? `@${f.other.username}` : `#${f.other.friend_id}`}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => respond(f.id, true)} className="flex-1 bg-green-600 text-white text-xs py-1.5 rounded-lg hover:bg-green-700">Accept</button>
                  <button onClick={() => respond(f.id, false)} className="flex-1 bg-cream-200 text-coffee-700 text-xs py-1.5 rounded-lg hover:bg-cream-300">Decline</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends list */}
      <div>
        <div className="text-xs font-medium text-coffee-600 uppercase tracking-wide mb-1.5">
          Friends ({friends.length})
        </div>
        {loading ? (
          <div className="text-xs text-coffee-500 py-2">Loading…</div>
        ) : friends.length === 0 ? (
          <div className="text-xs text-coffee-500 py-2">No friends yet. Search by @username or #ID above.</div>
        ) : (
          <div className="space-y-1">
            {friends.map((f) => (
              <div key={f.id} className="flex items-center justify-between py-1.5 px-1 hover:bg-cream-100 rounded-lg group">
                <div>
                  <div className="text-sm text-coffee-900">{f.other.full_name ?? "Student"}</div>
                  <div className="text-xs text-coffee-500">
                    {f.other.username ? `@${f.other.username}` : `#${f.other.friend_id}`}
                  </div>
                </div>
                <button
                  onClick={() => startDM(f.other.id)}
                  className="opacity-0 group-hover:opacity-100 text-xs bg-coffee-800 text-cream-50 px-2.5 py-1 rounded-full transition"
                >
                  DM
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
