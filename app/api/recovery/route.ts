import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/recovery?athleteId=...&from=YYYY-MM-DD&to=YYYY-MM-DD
 * Returns recovery_daily entries for the active athlete, optionally filtered by date range.
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

  let query = supabase
    .from("recovery_daily")
    .select("*")
    .eq("athlete_id", athleteId)
    .order("date", { ascending: false });

  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (from) query = query.gte("date", from);
  if (to) query = query.lte("date", to);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

/**
 * POST /api/recovery
 * Create a manual recovery entry.
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
    date,
    sleepStart,
    sleepEnd,
    sleepMinutes,
    sleepScore,
    restingHr,
    hrvMs,
    notes,
    athleteId: bodyAthleteId,
  } = body;

  if (!date) {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }

  let athleteId: string;
  if (profile?.role === "PSYCHOLOGIST") {
    athleteId = bodyAthleteId ?? user.id;
  } else {
    athleteId = user.id;
  }

  const { data, error } = await supabase
    .from("recovery_daily")
    .upsert(
      {
        athlete_id: athleteId,
        date,
        source: "manual",
        sleep_start: sleepStart ?? null,
        sleep_end: sleepEnd ?? null,
        sleep_minutes: sleepMinutes ?? null,
        sleep_score: sleepScore ?? null,
        resting_hr: restingHr ?? null,
        hrv_ms: hrvMs ?? null,
        notes: notes?.trim() || null,
      },
      { onConflict: "athlete_id,date,source" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
