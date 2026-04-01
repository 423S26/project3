import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/assessments/context?assessmentId=<id>
 * Returns same-day context for a completed assessment:
 *   - check_ins (psychological state)
 *   - workout_sessions (physical training)
 *   - meal_logs (nutrition)
 *
 * Access: the athlete themselves or their assigned psychologist.
 */
export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const assessmentId = searchParams.get("assessmentId");

  if (!assessmentId) {
    return NextResponse.json(
      { error: "assessmentId is required" },
      { status: 400 }
    );
  }

  // Fetch the assessment to get athlete_id and completion date
  const { data: assessment, error: assessmentError } = await supabase
    .from("assessments")
    .select("id, athlete_id, psychologist_id, status, updated_at, created_at")
    .eq("id", assessmentId)
    .maybeSingle();

  if (assessmentError || !assessment) {
    return NextResponse.json(
      { error: "Assessment not found" },
      { status: 404 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // Access control: athlete owns it, or psychologist is assigned to the athlete
  const isOwner = user.id === assessment.athlete_id;
  const isPsychologist =
    profile?.role === "PSYCHOLOGIST" &&
    user.id === assessment.psychologist_id;

  if (!isOwner && !isPsychologist) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Use updated_at for completed assessments (when answers were submitted),
  // fall back to created_at for other statuses
  const referenceDate =
    assessment.status === "completed"
      ? assessment.updated_at
      : assessment.created_at;
  const date = referenceDate.split("T")[0]; // YYYY-MM-DD

  const athleteId = assessment.athlete_id;

  // Fetch same-day data in parallel
  const [checkInsResult, workoutsResult, mealsResult] = await Promise.all([
    supabase
      .from("check_ins")
      .select("id, mood, stress, motivation, notes, brums_subscales_json, created_at")
      .eq("athlete_id", athleteId)
      .gte("created_at", `${date}T00:00:00.000Z`)
      .lt("created_at", `${date}T23:59:59.999Z`)
      .order("created_at", { ascending: true }),

    supabase
      .from("workout_sessions")
      .select("id, name, type, sport, duration_min, rpe, intensity, notes, started_at, ended_at")
      .eq("athlete_id", athleteId)
      .gte("started_at", `${date}T00:00:00.000Z`)
      .lt("started_at", `${date}T23:59:59.999Z`)
      .order("started_at", { ascending: true }),

    supabase
      .from("meal_logs")
      .select("id, meal_type, meal_name, calories, protein_g, carbs_g, fat_g, logged_at")
      .eq("athlete_id", athleteId)
      .gte("logged_at", `${date}T00:00:00.000Z`)
      .lt("logged_at", `${date}T23:59:59.999Z`)
      .order("logged_at", { ascending: true }),
  ]);

  return NextResponse.json({
    date,
    checkIns: checkInsResult.data ?? [],
    workoutSessions: workoutsResult.data ?? [],
    mealLogs: mealsResult.data ?? [],
  });
}
