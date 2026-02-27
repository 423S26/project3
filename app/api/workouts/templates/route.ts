import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/workouts/templates?athleteId=...
 * Returns workout templates with their exercises.
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

  const { data, error } = await supabase
    .from("workout_templates")
    .select(`
      *,
      workout_template_exercises ( id, exercise_name, default_sets, default_reps, default_weight_kg, sort_order )
    `)
    .eq("athlete_id", athleteId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

/**
 * POST /api/workouts/templates
 * Create a workout template.
 * Body: { name, sport?, type?, exercises?: [{ exerciseName, defaultSets?, defaultReps?, defaultWeightKg? }] }
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
  const { name, sport, type = "strength", exercises } = body;

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const { data: template, error: tplError } = await supabase
    .from("workout_templates")
    .insert({
      athlete_id: user.id,
      name,
      sport: sport ?? null,
      type,
    })
    .select()
    .single();

  if (tplError) {
    return NextResponse.json({ error: tplError.message }, { status: 500 });
  }

  if (Array.isArray(exercises) && exercises.length > 0) {
    const rows = exercises.map(
      (ex: { exerciseName: string; defaultSets?: number; defaultReps?: number; defaultWeightKg?: number; exerciseLibraryId?: string }, i: number) => ({
        template_id: template.id,
        exercise_name: ex.exerciseName,
        default_sets: ex.defaultSets ?? null,
        default_reps: ex.defaultReps ?? null,
        default_weight_kg: ex.defaultWeightKg ?? null,
        exercise_library_id: ex.exerciseLibraryId ?? null,
        sort_order: i,
      })
    );

    const { error: exError } = await supabase
      .from("workout_template_exercises")
      .insert(rows);

    if (exError) {
      return NextResponse.json({ error: exError.message }, { status: 500 });
    }
  }

  return NextResponse.json(template, { status: 201 });
}
