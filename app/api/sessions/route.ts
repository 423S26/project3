import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/sessions
 * Athletes: returns the signed-in athlete's sessions.
 * Psychologists: returns all sessions where they are the psychologist,
 *   optionally filtered by ?athleteId=...
 */
export async function GET(req: Request) {
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

  const { searchParams } = new URL(req.url);

  if (profile?.role === "PSYCHOLOGIST") {
    let q = supabase
      .from("psychologist_sessions")
      .select(
        "id, athlete_id, psychologist_id, session_type, status, starts_at, duration_min, location, notes, created_at, athlete:athlete_id(name, email)"
      )
      .eq("psychologist_id", user.id)
      .order("starts_at", { ascending: true });

    const requestedAthlete = searchParams.get("athleteId");
    if (requestedAthlete) {
      q = q.eq("athlete_id", requestedAthlete);
    }

    const { data: sessions, error } = await q;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(sessions ?? []);
  }

  // Athlete path
  const { data: sessions, error } = await supabase
    .from("psychologist_sessions")
    .select(
      "id, athlete_id, psychologist_id, session_type, status, starts_at, duration_min, location, notes, created_at, psychologist:psychologist_id(name, email)"
    )
    .eq("athlete_id", user.id)
    .order("starts_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(sessions ?? []);
}

/**
 * POST /api/sessions
 * Athlete creates a new session with their assigned psychologist.
 * Body: { sessionType, startsAt, durationMin?, location?, notes? }
 */
export async function POST(req: Request) {
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

  if (profile?.role !== "ATHLETE") {
    return NextResponse.json(
      { error: "Only athletes can schedule sessions" },
      { status: 403 }
    );
  }

  const { data: assignment } = await supabase
    .from("psychologist_athletes")
    .select("psychologist_id")
    .eq("athlete_id", user.id)
    .maybeSingle();

  if (!assignment?.psychologist_id) {
    return NextResponse.json(
      {
        error:
          "You are not assigned to a psychologist yet. Please contact your team administrator.",
      },
      { status: 400 }
    );
  }

  const body = await req.json();
  const { sessionType, startsAt, durationMin, location, notes } = body;

  if (!sessionType || !startsAt) {
    return NextResponse.json(
      { error: "sessionType and startsAt are required" },
      { status: 400 }
    );
  }

  if (!["virtual", "in_person"].includes(sessionType)) {
    return NextResponse.json(
      { error: "sessionType must be 'virtual' or 'in_person'" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("psychologist_sessions")
    .insert({
      athlete_id: user.id,
      psychologist_id: assignment.psychologist_id,
      session_type: sessionType,
      starts_at: startsAt,
      duration_min: durationMin ?? 50,
      location: location ?? null,
      notes: notes ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

/**
 * PATCH /api/sessions?id=<session-id>
 * Athletes update their own sessions; psychologists update sessions they are assigned to.
 */
export async function PATCH(req: Request) {
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

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("id");

  if (!sessionId) {
    return NextResponse.json(
      { error: "id query parameter is required" },
      { status: 400 }
    );
  }

  const body = await req.json();

  const updates: Record<string, unknown> = {};
  if (body.status) updates.status = body.status;
  if (body.startsAt) updates.starts_at = body.startsAt;
  if (body.sessionType) updates.session_type = body.sessionType;
  if (body.location !== undefined) updates.location = body.location;
  if (body.notes !== undefined) updates.notes = body.notes;
  if (body.durationMin !== undefined) updates.duration_min = body.durationMin;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const ownerColumn =
    profile?.role === "PSYCHOLOGIST" ? "psychologist_id" : "athlete_id";

  const { data, error } = await supabase
    .from("psychologist_sessions")
    .update(updates)
    .eq("id", sessionId)
    .eq(ownerColumn, user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
