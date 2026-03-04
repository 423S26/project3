import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ threadId: string }>;
}

/**
 * GET /api/messages/[threadId]
 * Returns all messages in a thread + marks it as read.
 */
export async function GET(_req: Request, ctx: RouteContext) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { threadId } = await ctx.params;

  // Verify thread membership
  const { data: thread } = await supabase
    .from("message_threads")
    .select("id, psychologist_id, athlete_id")
    .eq("id", threadId)
    .single();

  if (!thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  if (thread.psychologist_id !== user.id && thread.athlete_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch messages
  const { data: messages, error } = await supabase
    .from("messages")
    .select("id, sender_id, body, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get the other participant's profile
  const otherId =
    thread.psychologist_id === user.id
      ? thread.athlete_id
      : thread.psychologist_id;

  const { data: otherUser } = await supabase
    .from("profiles")
    .select("id, name, email, role")
    .eq("id", otherId)
    .single();

  // Mark as read
  await supabase
    .from("message_thread_reads")
    .upsert(
      {
        thread_id: threadId,
        user_id: user.id,
        last_read_at: new Date().toISOString(),
      },
      { onConflict: "thread_id,user_id" }
    );

  return NextResponse.json({
    thread,
    otherUser: otherUser ?? { id: otherId, name: "Unknown", email: "", role: "ATHLETE" },
    messages: messages ?? [],
  });
}

/**
 * POST /api/messages/[threadId]
 * Send a message in a thread.
 * Body: { body: string }
 */
export async function POST(req: Request, ctx: RouteContext) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { threadId } = await ctx.params;

  // Verify thread membership
  const { data: thread } = await supabase
    .from("message_threads")
    .select("id, psychologist_id, athlete_id")
    .eq("id", threadId)
    .single();

  if (!thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  if (thread.psychologist_id !== user.id && thread.athlete_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { body } = await req.json();

  if (!body?.trim()) {
    return NextResponse.json({ error: "body is required" }, { status: 400 });
  }

  const { data: msg, error } = await supabase
    .from("messages")
    .insert({
      thread_id: threadId,
      sender_id: user.id,
      body: body.trim(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update thread timestamp
  await supabase
    .from("message_threads")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", threadId);

  // Mark as read for sender
  await supabase
    .from("message_thread_reads")
    .upsert(
      {
        thread_id: threadId,
        user_id: user.id,
        last_read_at: new Date().toISOString(),
      },
      { onConflict: "thread_id,user_id" }
    );

  return NextResponse.json(msg, { status: 201 });
}
