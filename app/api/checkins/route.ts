import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/checkins?athleteId=...&date=YYYY-MM-DD
 * Returns check-ins for the active athlete, optionally filtered by date.
 */
export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Determine the caller's role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date"); // YYYY-MM-DD
  let athleteId: string;

  if (profile?.role === "PSYCHOLOGIST") {
    const requested = searchParams.get("athleteId");
    if (!requested) {
      return NextResponse.json(
        { error: "athleteId required for psychologist" },
        { status: 400 }
      );
    }
    athleteId = requested;
  } else {
    athleteId = user.id;
  }

  // Build query
  let query = supabase
    .from("check_ins")
    .select("*")
    .eq("athlete_id", athleteId)
    .order("created_at", { ascending: true });

  if (dateParam) {
    const [y, m, d] = dateParam.split("-").map(Number);
    const gte = new Date(y, m - 1, d, 0, 0, 0, 0).toISOString();
    const lte = new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
    query = query.gte("created_at", gte).lte("created_at", lte);
  }

  const { data: checkIns, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Transform to match the client-expected shape
  const result = (checkIns ?? []).map((ci) => ({
    id: ci.id,
    athleteId: ci.athlete_id,
    mood: ci.mood,
    stress: ci.stress,
    motivation: ci.motivation,
    notes: ci.notes,
    brums: ci.brums_json
      ? {
          completed: true,
          items: ci.brums_json,
          subscales: ci.brums_subscales_json ?? null,
        }
      : undefined,
    createdAt: ci.created_at,
  }));

  return NextResponse.json(result);
}

/**
 * POST /api/checkins
 * Create a new check-in for the authenticated athlete (or specified athlete if psychologist).
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

  const body = await req.json();
  const {
    mood,
    stress,
    motivation,
    notes,
    brums,
    createdAt,
    athleteId: bodyAthleteId,
  } = body;

  // Validate required fields
  if (
    typeof mood !== "number" || mood < 1 || mood > 10 ||
    typeof stress !== "number" || stress < 1 || stress > 10 ||
    typeof motivation !== "number" || motivation < 1 || motivation > 10
  ) {
    return NextResponse.json(
      { error: "mood, stress, and motivation must be numbers 1-10" },
      { status: 400 }
    );
  }

  let athleteId: string;
  if (profile?.role === "PSYCHOLOGIST") {
    athleteId = bodyAthleteId ?? user.id;
  } else {
    athleteId = user.id;
  }

  const { data: checkIn, error } = await supabase
    .from("check_ins")
    .insert({
      athlete_id: athleteId,
      mood,
      stress,
      motivation,
      notes: notes?.trim() || null,
      brums_json: brums?.items ?? null,
      brums_subscales_json: brums?.subscales ?? null,
      created_at: createdAt ? new Date(createdAt).toISOString() : new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      id: checkIn.id,
      athleteId: checkIn.athlete_id,
      mood: checkIn.mood,
      stress: checkIn.stress,
      motivation: checkIn.motivation,
      notes: checkIn.notes,
      brums: brums?.items
        ? { completed: true, items: brums.items, subscales: brums.subscales }
        : undefined,
      createdAt: checkIn.created_at,
    },
    { status: 201 }
  );
}
