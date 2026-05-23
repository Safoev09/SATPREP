import Link from "next/link";
import { requireStudent } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase-server";
import CommunityChat from "@/components/CommunityChat";

export default async function CommunityPage() {
  const { profile } = await requireStudent();
  const supabase = createClient();

  const { data: channels } = await supabase
    .from("channels")
    .select("*")
    .order("position", { ascending: true });

  if (!channels || channels.length === 0) {
    return (
      <div className="p-10 max-w-2xl">
        <div className="bg-cream-50 border border-coffee-700/10 rounded-2xl p-10 text-center">
          <div className="text-5xl mb-4">💬</div>
          <h1 className="font-display text-2xl font-semibold text-coffee-900 mb-2">
            Community not set up yet
          </h1>
          <p className="text-coffee-600 mb-6">
            The chat channels haven't been created. The site owner needs to run the{" "}
            <code>migration-chat.sql</code> file in Supabase.
          </p>
          <Link
            href="/app"
            className="inline-block bg-coffee-800 hover:bg-coffee-900 text-cream-50 px-6 py-2.5 rounded-full text-sm font-medium"
          >
            ← Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const firstChannelId = channels[0].id;

  // Load recent messages for the first channel
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("channel_id", firstChannelId)
    .order("created_at", { ascending: true })
    .limit(100);

  return (
    <CommunityChat
      channels={channels}
      initialChannelId={firstChannelId}
      initialMessages={messages ?? []}
      currentUserId={profile.id}
      currentUserName={profile.full_name ?? "Student"}
    />
  );
}
