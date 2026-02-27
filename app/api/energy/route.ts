import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/energy?from=YYYY-MM-DD&to=YYYY-MM-DD&athleteId=...
 *
 * Returns daily energy totals:
 *   - calories_in  (sum from meal_logs)
 *   - calories_out_wearable (from recovery_daily)
 *   - calories_out_est (sum from workout_sessions)
 *   - net (in − out)
 *   - quality label
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

  const from = searchParams.get("from"); // YYYY-MM-DD
  const to = searchParams.get("to"); // YYYY-MM-DD

  if (!from || !to) {
    return NextResponse.json(
      { error: "from and to query params are required (YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  // 1. Calories IN: sum from meal_logs per day
  const { data: meals } = await supabase
    .from("meal_logs")
    .select("logged_at, calories, protein_g, carbs_g, fat_g")
    .eq("athlete_id", athleteId)
    .gte("logged_at", `${from}T00:00:00`)
    .lte("logged_at", `${to}T23:59:59`);

  // 2. Calories OUT (wearable): from recovery_daily
  const { data: recovery } = await supabase
    .from("recovery_daily")
    .select("date, calories_out_wearable, source")
    .eq("athlete_id", athleteId)
    .gte("date", from)
    .lte("date", to);

  // 3. Calories OUT (estimated): from workout_sessions
  const { data: workouts } = await supabase
    .from("workout_sessions")
    .select("started_at, calories_out_est")
    .eq("athlete_id", athleteId)
    .gte("started_at", `${from}T00:00:00`)
    .lte("started_at", `${to}T23:59:59`);

  // 4. Check if athlete has bodyweight set
  const { data: athleteProfile } = await supabase
    .from("athlete_profiles")
    .select("bodyweight_kg")
    .eq("user_id", athleteId)
    .single();

  const hasBodyweight = athleteProfile?.bodyweight_kg != null && athleteProfile.bodyweight_kg > 0;

  // ── Aggregate by date ────────────────────────────────────

  interface DayEnergy {
    date: string;
    calories_in: number;
    protein_in: number;
    carbs_in: number;
    fat_in: number;
    calories_out_wearable: number | null;
    calories_out_est: number;
    calories_out_total: number;
    net: number;
    quality: string;
  }

  const dayMap: Record<string, DayEnergy> = {};

  function ensureDay(date: string): DayEnergy {
    if (!dayMap[date]) {
      dayMap[date] = {
        date,
        calories_in: 0,
        protein_in: 0,
        carbs_in: 0,
        fat_in: 0,
        calories_out_wearable: null,
        calories_out_est: 0,
        calories_out_total: 0,
        net: 0,
        quality: "no_data",
      };
    }
    return dayMap[date];
  }

  // Meals → calories in
  for (const m of meals ?? []) {
    const date = m.logged_at?.split("T")[0];
    if (!date) continue;
    const day = ensureDay(date);
    day.calories_in += m.calories ?? 0;
    day.protein_in += m.protein_g ?? 0;
    day.carbs_in += m.carbs_g ?? 0;
    day.fat_in += m.fat_g ?? 0;
  }

  // Recovery → wearable calories out (take the max across sources for a day)
  for (const r of recovery ?? []) {
    if (r.calories_out_wearable == null) continue;
    const day = ensureDay(r.date);
    if (day.calories_out_wearable == null || r.calories_out_wearable > day.calories_out_wearable) {
      day.calories_out_wearable = r.calories_out_wearable;
    }
  }

  // Workouts → estimated calories out
  for (const w of workouts ?? []) {
    if (w.calories_out_est == null) continue;
    const date = w.started_at?.split("T")[0];
    if (!date) continue;
    const day = ensureDay(date);
    day.calories_out_est += w.calories_out_est;
  }

  // Compute totals + quality labels
  const days = Object.values(dayMap).map((day) => {
    const wearable = day.calories_out_wearable ?? 0;
    const estimated = day.calories_out_est;
    day.calories_out_total = wearable + estimated;
    day.net = day.calories_in - day.calories_out_total;

    // Quality labels
    if (day.calories_out_wearable != null && estimated > 0) {
      day.quality = "mixed";
    } else if (day.calories_out_wearable != null) {
      day.quality = "wearable_only";
    } else if (estimated > 0) {
      day.quality = "estimate_only";
    } else if (!hasBodyweight) {
      day.quality = "missing_weight";
    } else {
      day.quality = "intake_only";
    }

    return day;
  });

  // Sort by date ascending
  days.sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({
    days,
    hasBodyweight,
    bodyweightKg: athleteProfile?.bodyweight_kg ?? null,
  });
}
