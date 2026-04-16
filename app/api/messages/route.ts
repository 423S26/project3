import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/messages
 * Returns all threads for the current user with last message preview + unread count.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isPsychologist = profile?.role === "PSYCHOLOGIST";

  // Fetch threads where the user is a participant
  const { data: threads, error } = await supabase
    .from("message_threads")
    .select(`
      id,
      psychologist_id,
      athlete_id,
      created_at,
      updated_at
    `)
    .or(`psychologist_id.eq.${user.id},athlete_id.eq.${user.id}`)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!threads || threads.length === 0) {
    return NextResponse.json([]);
  }

  // For each thread, get the other participant's profile, last message, and unread count
  const enriched = await Promise.all(
    threads.map(async (thread) => {
      const otherId = isPsychologist ? thread.athlete_id : thread.psychologist_id;

      const [profileRes, lastMsgRes, readRes, unreadRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, name, email")
          .eq("id", otherId)
          .single(),
        supabase
          .from("messages")
          .select("id, body, sender_id, created_at")
          .eq("thread_id", thread.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from("message_thread_reads")
          .select("last_read_at")
          .eq("thread_id", thread.id)
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("thread_id", thread.id)
          .neq("sender_id", user.id),
      ]);

      const lastReadAt = readRes.data?.last_read_at;

      // Count unread: messages from the other person after our last read
      let unreadCount = 0;
      if (lastReadAt) {
        const { count } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("thread_id", thread.id)
          .neq("sender_id", user.id)
          .gt("created_at", lastReadAt);
        unreadCount = count ?? 0;
      } else {
        // Never read — all messages from the other person are unread
        unreadCount = unreadRes.count ?? 0;
      }

      return {
        id: thread.id,
        otherUser: profileRes.data ?? { id: otherId, name: "Unknown", email: "" },
        lastMessage: lastMsgRes.data ?? null,
        unreadCount,
        updatedAt: thread.updated_at,
      };
    })
  );

  return NextResponse.json(enriched);
}

/**
 * POST /api/messages
 * Create a new thread (or return existing) and send the first message.
 * Body: { otherUserId: string, body: string }
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { otherUserId, body } = await req.json();

  if (!otherUserId || !body?.trim()) {
    return NextResponse.json(
      { error: "otherUserId and body are required" },
      { status: 400 }
    );
  }

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const { data: otherProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", otherUserId)
    .single();

  if (!myProfile || !otherProfile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Determine psychologist/athlete pairing
  let psychologistId: string;
  let athleteId: string;

  if (myProfile.role === "PSYCHOLOGIST" && otherProfile.role === "ATHLETE") {
    psychologistId = user.id;
    athleteId = otherUserId;
  } else if (myProfile.role === "ATHLETE" && otherProfile.role === "PSYCHOLOGIST") {
    psychologistId = otherUserId;
    athleteId = user.id;
  } else {
    return NextResponse.json(
      { error: "Messaging is only between a psychologist and an athlete" },
      { status: 400 }
    );
  }

  // Find existing thread or create one
  let threadId: string;
  const { data: existing } = await supabase
    .from("message_threads")
    .select("id")
    .eq("psychologist_id", psychologistId)
    .eq("athlete_id", athleteId)
    .maybeSingle();

  if (existing) {
    threadId = existing.id;
  } else {
    const { data: newThread, error: threadError } = await supabase
      .from("message_threads")
      .insert({ psychologist_id: psychologistId, athlete_id: athleteId })
      .select("id")
      .single();

    if (threadError) {
      return NextResponse.json({ error: threadError.message }, { status: 500 });
    }
    threadId = newThread.id;
  }

  // Send the message
  const { data: msg, error: msgError } = await supabase
    .from("messages")
    .insert({
      thread_id: threadId,
      sender_id: user.id,
      body: body.trim(),
    })
    .select()
    .single();

  if (msgError) {
    return NextResponse.json({ error: msgError.message }, { status: 500 });
  }

  // Update the thread's updated_at
  await supabase
    .from("message_threads")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", threadId);

  // Mark as read for the sender
  await supabase
    .from("message_thread_reads")
    .upsert(
      { thread_id: threadId, user_id: user.id, last_read_at: new Date().toISOString() },
      { onConflict: "thread_id,user_id" }
    );

  return NextResponse.json({ threadId, message: msg }, { status: 201 });
}
