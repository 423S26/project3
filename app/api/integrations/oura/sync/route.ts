import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * POST /api/integrations/oura/sync
 * Fetches the last 7 days of sleep and readiness data from Oura API v2
 * and upserts into recovery_daily.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createServiceClient();

  const { data: conn, error: connErr } = await service
    .from("integration_connections")
    .select("access_token, refresh_token, expires_at")
    .eq("athlete_id", user.id)
    .eq("provider", "oura")
    .single();

  if (connErr || !conn) {
    return NextResponse.json(
      { error: "Oura not connected. Please authorize first." },
      { status: 400 }
    );
  }

  const accessToken = conn.access_token;

  // Date range
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const startDate = weekAgo.toISOString().split("T")[0];
  const endDate = today.toISOString().split("T")[0];

  const synced: string[] = [];

  try {
    // Fetch daily sleep data (Oura API v2)
    const sleepRes = await fetch(
      `https://api.ouraring.com/v2/usercollection/daily_sleep?start_date=${startDate}&end_date=${endDate}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    interface OuraSleepDay {
      day: string;
      score?: number;
      contributors?: {
        total_sleep?: number;
        deep_sleep?: number;
        rem_sleep?: number;
      };
    }

    const sleepByDate: Record<string, { score?: number }> = {};
    if (sleepRes.ok) {
      const sleepData = await sleepRes.json();
      for (const s of (sleepData.data ?? []) as OuraSleepDay[]) {
        sleepByDate[s.day] = { score: s.score ?? undefined };
      }
    }

    // Fetch sleep periods for detailed times
    const sleepPeriodRes = await fetch(
      `https://api.ouraring.com/v2/usercollection/sleep?start_date=${startDate}&end_date=${endDate}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    interface OuraSleepPeriod {
      day: string;
      bedtime_start?: string;
      bedtime_end?: string;
      total_sleep_duration?: number;
      average_heart_rate?: number;
      average_hrv?: number;
    }

    const periodByDate: Record<string, OuraSleepPeriod> = {};
    if (sleepPeriodRes.ok) {
      const periodData = await sleepPeriodRes.json();
      for (const p of (periodData.data ?? []) as OuraSleepPeriod[]) {
        // Use the first (longest) sleep period per date
        if (!periodByDate[p.day]) {
          periodByDate[p.day] = p;
        }
      }
    }

    // Fetch heart rate (resting) via daily readiness
    const readinessRes = await fetch(
      `https://api.ouraring.com/v2/usercollection/daily_readiness?start_date=${startDate}&end_date=${endDate}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    interface OuraReadinessDay {
      day: string;
      score?: number;
      temperature_deviation?: number;
    }

    const readinessByDate: Record<string, OuraReadinessDay> = {};
    if (readinessRes.ok) {
      const readinessData = await readinessRes.json();
      for (const r of (readinessData.data ?? []) as OuraReadinessDay[]) {
        readinessByDate[r.day] = r;
      }
    }

    // Fetch daily activity for calories burned
    const activityRes = await fetch(
      `https://api.ouraring.com/v2/usercollection/daily_activity?start_date=${startDate}&end_date=${endDate}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    interface OuraActivityDay {
      day: string;
      total_calories?: number;
      active_calories?: number;
    }

    const caloriesByDate: Record<string, number> = {};
    if (activityRes.ok) {
      const activityData = await activityRes.json();
      for (const a of (activityData.data ?? []) as OuraActivityDay[]) {
        if (a.total_calories) {
          caloriesByDate[a.day] = a.total_calories;
        }
      }
    }

    // Build dates list
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split("T")[0]);
    }

    for (const date of dates) {
      const sleep = sleepByDate[date];
      const period = periodByDate[date];
      const calsOut = caloriesByDate[date];

      if (!sleep && !period && !readinessByDate[date] && !calsOut) continue;

      const sleepMinutes = period?.total_sleep_duration
        ? Math.round(period.total_sleep_duration / 60)
        : null;

      const { error: upsertError } = await supabase
        .from("recovery_daily")
        .upsert(
          {
            athlete_id: user.id,
            date,
            source: "oura",
            sleep_start: period?.bedtime_start ?? null,
            sleep_end: period?.bedtime_end ?? null,
            sleep_minutes: sleepMinutes,
            sleep_score: sleep?.score ?? null,
            resting_hr: period?.average_heart_rate ?? null,
            hrv_ms: period?.average_hrv ?? null,
            calories_out_wearable: calsOut ?? null,
          },
          { onConflict: "athlete_id,date,source" }
        );

      if (!upsertError) {
        synced.push(date);
      }
    }

    return NextResponse.json({ synced, count: synced.length });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to sync Oura data", detail: String(err) },
      { status: 502 }
    );
  }
}
