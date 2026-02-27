import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/events?from=YYYY-MM-DD&to=YYYY-MM-DD&athleteId=...
 * Returns a unified array of AnchorEvent-shaped objects across all categories:
 *   mood (check-ins), recovery, training (workouts), fueling (meals)
 * All dates are ISO strings; the client reconstructs Date objects.
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

  // We'll build all sub-queries in parallel
  const promises: Promise<AnchorEventDTO[]>[] = [];

  // ── 1. Mood check-ins ──────────────────────────────────────
  promises.push(
    (async () => {
      let q = supabase
        .from("check_ins")
        .select("id, athlete_id, mood, stress, motivation, notes, brums_json, created_at")
        .eq("athlete_id", athleteId)
        .order("created_at", { ascending: true });

      if (from) q = q.gte("created_at", `${from}T00:00:00`);
      if (to) q = q.lte("created_at", `${to}T23:59:59`);

      const { data } = await q;
      return (data ?? []).map((ci) => ({
        id: ci.id,
        title: ci.brums_json ? "Mood Profile" : "Check-In",
        category: "mood" as const,
        start: ci.created_at,
        end: new Date(new Date(ci.created_at).getTime() + 15 * 60_000).toISOString(),
        allDay: false,
        description: `Mood ${ci.mood} · Stress ${ci.stress} · Motivation ${ci.motivation}${ci.notes ? `. ${ci.notes}` : ""}`,
        metadata: { mood: ci.mood, stress: ci.stress, motivation: ci.motivation, checkInId: ci.id },
      }));
    })()
  );

  // ── 2. Recovery daily ──────────────────────────────────────
  promises.push(
    (async () => {
      let q = supabase
        .from("recovery_daily")
        .select("*")
        .eq("athlete_id", athleteId)
        .order("date", { ascending: true });

      if (from) q = q.gte("date", from);
      if (to) q = q.lte("date", to);

      const { data } = await q;
      return (data ?? []).map((r) => {
        const parts: string[] = [];
        if (r.sleep_minutes) parts.push(`Sleep: ${Math.round(r.sleep_minutes / 60 * 10) / 10}h`);
        if (r.sleep_score) parts.push(`Score: ${r.sleep_score}`);
        if (r.resting_hr) parts.push(`RHR: ${r.resting_hr}`);
        if (r.hrv_ms) parts.push(`HRV: ${r.hrv_ms}ms`);
        if (r.calories_out_wearable) parts.push(`Wearable burn: ${Math.round(r.calories_out_wearable)} cal`);
        if (r.notes) parts.push(r.notes);

        return {
          id: r.id,
          title: `Recovery (${r.source})`,
          category: "recovery" as const,
          start: `${r.date}T06:00:00`,
          end: `${r.date}T06:30:00`,
          allDay: false,
          description: parts.join(" · ") || "Recovery logged",
          metadata: {
            source: r.source,
            sleepMinutes: r.sleep_minutes,
            sleepScore: r.sleep_score,
            restingHr: r.resting_hr,
            hrvMs: r.hrv_ms,
            caloriesOutWearable: r.calories_out_wearable,
          },
        };
      });
    })()
  );

  // ── 3. Workout sessions (training) ─────────────────────────
  promises.push(
    (async () => {
      let q = supabase
        .from("workout_sessions")
        .select("id, name, type, sport, started_at, ended_at, duration_min, rpe, intensity, notes, calories_out_est")
        .eq("athlete_id", athleteId)
        .order("started_at", { ascending: true });

      if (from) q = q.gte("started_at", `${from}T00:00:00`);
      if (to) q = q.lte("started_at", `${to}T23:59:59`);

      const { data } = await q;
      return (data ?? []).map((w) => {
        const parts: string[] = [];
        if (w.sport) parts.push(w.sport);
        if (w.rpe) parts.push(`RPE ${w.rpe}`);
        if (w.duration_min) parts.push(`${w.duration_min} min`);
        if (w.calories_out_est) parts.push(`Est. burn: ${Math.round(w.calories_out_est)} cal`);
        if (w.notes) parts.push(w.notes);

        const startedAt = w.started_at;
        const endedAt =
          w.ended_at ??
          (w.duration_min
            ? new Date(new Date(w.started_at).getTime() + w.duration_min * 60_000).toISOString()
            : new Date(new Date(w.started_at).getTime() + 60 * 60_000).toISOString());

        return {
          id: w.id,
          title: w.name,
          category: "training" as const,
          start: startedAt,
          end: endedAt,
          allDay: false,
          description: parts.join(" · ") || w.type,
          metadata: {
            type: w.type,
            rpe: w.rpe,
            durationMin: w.duration_min,
            sport: w.sport,
            caloriesOutEst: w.calories_out_est,
          },
        };
      });
    })()
  );

  // ── 4. Meal logs (fueling) ─────────────────────────────────
  promises.push(
    (async () => {
      let q = supabase
        .from("meal_logs")
        .select("id, meal_name, meal_type, logged_at, calories, protein_g, carbs_g, fat_g, notes, serving_qty, serving_unit")
        .eq("athlete_id", athleteId)
        .order("logged_at", { ascending: true });

      if (from) q = q.gte("logged_at", `${from}T00:00:00`);
      if (to) q = q.lte("logged_at", `${to}T23:59:59`);

      const { data } = await q;
      return (data ?? []).map((m) => {
        const parts: string[] = [];
        if (m.calories) parts.push(`${Math.round(m.calories)} cal`);
        if (m.protein_g) parts.push(`P: ${Math.round(m.protein_g)}g`);
        if (m.carbs_g) parts.push(`C: ${Math.round(m.carbs_g)}g`);
        if (m.fat_g) parts.push(`F: ${Math.round(m.fat_g)}g`);
        if (m.serving_qty && m.serving_unit) parts.push(`(${m.serving_qty} ${m.serving_unit})`);
        if (m.notes) parts.push(m.notes);

        return {
          id: m.id,
          title: m.meal_name,
          category: "fueling" as const,
          start: m.logged_at,
          end: new Date(new Date(m.logged_at).getTime() + 30 * 60_000).toISOString(),
          allDay: false,
          description: parts.join(" · ") || (m.meal_type ?? "Meal"),
          metadata: {
            mealType: m.meal_type,
            calories: m.calories,
            proteinG: m.protein_g,
            carbsG: m.carbs_g,
            fatG: m.fat_g,
            servingQty: m.serving_qty,
            servingUnit: m.serving_unit,
          },
        };
      });
    })()
  );

  // Wait for all in parallel
  const results = await Promise.all(promises);
  const events = results.flat().sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  return NextResponse.json(events);
}

/** Serialized AnchorEvent shape for the API response */
interface AnchorEventDTO {
  id: string;
  title: string;
  category: string;
  start: string;
  end: string;
  allDay: boolean;
  description: string;
  metadata: Record<string, unknown>;
}
