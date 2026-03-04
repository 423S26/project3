"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/components/auth/session-provider";

/**
 * Displays total unread message count as a badge.
 * Polls periodically and listens for realtime inserts.
 */
export function UnreadBadge() {
  const { user, supabase } = useSession();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    let mounted = true;

    async function loadUnread() {
      // Get all threads for this user
      const { data: threads } = await supabase
        .from("message_threads")
        .select("id")
        .or(`psychologist_id.eq.${user!.id},athlete_id.eq.${user!.id}`);

      if (!threads || threads.length === 0) {
        if (mounted) setCount(0);
        return;
      }

      let total = 0;
      for (const thread of threads) {
        // Get last read timestamp
        const { data: readData } = await supabase
          .from("message_thread_reads")
          .select("last_read_at")
          .eq("thread_id", thread.id)
          .eq("user_id", user!.id)
          .maybeSingle();

        let query = supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("thread_id", thread.id)
          .neq("sender_id", user!.id);

        if (readData?.last_read_at) {
          query = query.gt("created_at", readData.last_read_at);
        }

        const { count: unread } = await query;
        total += unread ?? 0;
      }

      if (mounted) setCount(total);
    }

    loadUnread();

    // Poll every 30 seconds for background updates
    const interval = setInterval(loadUnread, 30_000);

    // Also listen for realtime message inserts to refresh faster
    const channel = supabase
      .channel("unread-badge")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMsg = payload.new as { sender_id: string };
          if (newMsg.sender_id !== user!.id) {
            loadUnread();
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  if (count === 0) return null;

  return (
    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
      {count > 99 ? "99+" : count}
    </span>
  );
}
