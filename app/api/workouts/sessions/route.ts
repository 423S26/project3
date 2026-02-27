import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { estimateCaloriesBurned } from "@/lib/calorie-estimate";

/**
 * GET /api/workouts/sessions?athleteId=...&from=YYYY-MM-DD&to=YYYY-MM-DD
 * Returns workout sessions with their exercises and sets.
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
    .from("workout_sessions")
    .select(`
      *,
      workout_session_exercises (
        id, exercise_name, sort_order,
        workout_sets ( id, set_number, reps, weight_kg, duration_sec, notes )
      )
    `)
    .eq("athlete_id", athleteId)
    .order("started_at", { ascending: false });

  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (from) query = query.gte("started_at", `${from}T00:00:00`);
  if (to) query = query.lte("started_at", `${to}T23:59:59`);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

/**
 * POST /api/workouts/sessions
 * Create a workout session (strength or sport_session).
 * Body: { name, type, sport?, startedAt?, endedAt?, durationMin?, rpe?, intensity?, notes?,
 *         exercises?: [{ exerciseName, sets?: [{ setNumber, reps?, weightKg?, durationSec? }] }] }
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    name,
    type = "strength",
    sport,
    templateId,
    startedAt,
    endedAt,
    durationMin,
    rpe,
    intensity,
    notes,
    exercises,
  } = body;

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  // Compute calories estimate for sport sessions
  let caloriesOutEst: number | null = null;
  let bodyweightWarning: string | null = null;

  if (type === "sport_session" && (durationMin || intensity || rpe)) {
    // Look up athlete bodyweight from profile
    const { data: athleteProfile } = await supabase
      .from("athlete_profiles")
      .select("bodyweight_kg")
      .eq("user_id", user.id)
      .single();

    const bodyweightKg = athleteProfile?.bodyweight_kg;

    if (!bodyweightKg || bodyweightKg <= 0) {
      bodyweightWarning = "Set your bodyweight in Settings to get calorie estimates.";
    }

    caloriesOutEst = estimateCaloriesBurned({
      durationMin: durationMin ?? null,
      intensity: intensity ?? null,
      rpe: rpe ?? null,
      bodyweightKg: bodyweightKg ?? null,
    });
  }

  // 1) Create the session
  const { data: session, error: sessionError } = await supabase
    .from("workout_sessions")
    .insert({
      athlete_id: user.id,
      template_id: templateId ?? null,
      type,
      name,
      sport: sport ?? null,
      started_at: startedAt ? new Date(startedAt).toISOString() : new Date().toISOString(),
      ended_at: endedAt ? new Date(endedAt).toISOString() : null,
      duration_min: durationMin ?? null,
      rpe: rpe ?? null,
      intensity: intensity ?? null,
      notes: notes?.trim() || null,
      calories_out_est: caloriesOutEst,
    })
    .select()
    .single();

  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 500 });
  }

  // 2) If exercises provided, create them with sets
  if (Array.isArray(exercises) && exercises.length > 0) {
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      const { data: exRow, error: exError } = await supabase
        .from("workout_session_exercises")
        .insert({
          session_id: session.id,
          exercise_name: ex.exerciseName,
          sort_order: i,
        })
        .select()
        .single();

      if (exError) {
        return NextResponse.json({ error: exError.message }, { status: 500 });
      }

      if (Array.isArray(ex.sets) && ex.sets.length > 0) {
        const setRows = ex.sets.map((s: { setNumber: number; reps?: number; weightKg?: number; durationSec?: number; notes?: string }) => ({
          session_exercise_id: exRow.id,
          set_number: s.setNumber,
          reps: s.reps ?? null,
          weight_kg: s.weightKg ?? null,
          duration_sec: s.durationSec ?? null,
          notes: s.notes ?? null,
        }));

        const { error: setError } = await supabase
          .from("workout_sets")
          .insert(setRows);

        if (setError) {
          return NextResponse.json({ error: setError.message }, { status: 500 });
        }
      }
    }
  }

  return NextResponse.json(
    {
      ...session,
      ...(bodyweightWarning ? { bodyweightWarning } : {}),
    },
    { status: 201 }
  );
}
