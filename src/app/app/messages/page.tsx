"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";
import CommunityChat from "@/components/CommunityChat";
import DirectMessages from "@/components/DirectMessages";
import GroupChats from "@/components/GroupChats";
import FriendPanel from "@/components/FriendPanel";

type Tab = "community" | "dms" | "groups";

export default function MessagesPage() {
  const [tab, setTab] = useState<Tab>("community");
  const [userId, setUserId] = useState<string | null>(null);
  const [unreadDMs, setUnreadDMs] = useState(0);
  const [unreadGroups, setUnreadGroups] = useState(0);
  const [showFriends, setShowFriends] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "community", label: "Community" },
    { id: "dms", label: "Direct Messages", badge: unreadDMs },
    { id: "groups", label: "Groups", badge: unreadGroups },
  ];

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Left panel — tab switcher + friend panel toggle */}
      <div className="w-64 border-r border-coffee-700/10 bg-cream-50 flex flex-col shrink-0">
        {/* Tabs */}
        <div className="p-4 space-y-1 border-b border-coffee-700/10">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-between ${
                tab === t.id
                  ? "bg-coffee-800 text-cream-50"
                  : "text-coffee-700 hover:bg-cream-100"
              }`}
            >
              <span>
                {t.id === "community" && "💬 "}
                {t.id === "dms" && "✉️ "}
                {t.id === "groups" && "👥 "}
                {t.label}
              </span>
              {t.badge && t.badge > 0 ? (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {t.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Friends section */}
        <div className="flex-1 overflow-y-auto p-4">
          <button
            onClick={() => setShowFriends((v) => !v)}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-coffee-700 hover:bg-cream-100 transition flex items-center justify-between"
          >
            <span>👤 Friends</span>
            <span className="text-coffee-500 text-xs">{showFriends ? "▲" : "▼"}</span>
          </button>
          {showFriends && userId && (
            <FriendPanel userId={userId} onStartDM={() => setTab("dms")} />
          )}
        </div>
      </div>

      {/* Right panel — active tab content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {tab === "community" && <CommunityChat />}
        {tab === "dms" && userId && (
          <DirectMessages
            userId={userId}
            onUnreadChange={setUnreadDMs}
          />
        )}
        {tab === "groups" && userId && (
          <GroupChats
            userId={userId}
            onUnreadChange={setUnreadGroups}
          />
        )}
        {(tab === "dms" || tab === "groups") && !userId && (
          <div className="flex-1 flex items-center justify-center text-coffee-600">
            Loading…
          </div>
        )}
      </div>
    </div>
  );
}
