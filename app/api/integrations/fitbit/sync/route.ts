import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * POST /api/integrations/fitbit/sync
 * Fetches the last 7 days of sleep and heart rate data from Fitbit and upserts
 * into recovery_daily. Uses service role for token reads.
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

  // Get stored tokens
  const { data: conn, error: connErr } = await service
    .from("integration_connections")
    .select("access_token, refresh_token, expires_at")
    .eq("athlete_id", user.id)
    .eq("provider", "fitbit")
    .single();

  if (connErr || !conn) {
    return NextResponse.json(
      { error: "Fitbit not connected. Please authorize first." },
      { status: 400 }
    );
  }

  let accessToken = conn.access_token;

  // Refresh token if expired
  if (conn.expires_at && new Date(conn.expires_at) < new Date()) {
    const refreshed = await refreshFitbitToken(conn.refresh_token, service, user.id);
    if (!refreshed) {
      return NextResponse.json(
        { error: "Failed to refresh Fitbit token. Please re-authorize." },
        { status: 401 }
      );
    }
    accessToken = refreshed;
  }

  // Determine date range (last 7 days)
  const today = new Date();
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }

  const synced: string[] = [];

  try {
    // Fetch sleep data (range endpoint)
    const startDate = dates[dates.length - 1];
    const endDate = dates[0];

    const sleepRes = await fetch(
      `https://api.fitbit.com/1.2/user/-/sleep/date/${startDate}/${endDate}.json`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const sleepByDate: Record<string, { minutes: number; startTime?: string; endTime?: string; score?: number }> = {};

    if (sleepRes.ok) {
      const sleepData = await sleepRes.json();
      for (const s of sleepData.sleep ?? []) {
        const date = s.dateOfSleep;
        if (!sleepByDate[date]) {
          sleepByDate[date] = {
            minutes: s.duration ? Math.round(s.duration / 60000) : 0,
            startTime: s.startTime,
            endTime: s.endTime,
            score: s.efficiency ?? null,
          };
        }
      }
    }

    // Fetch resting heart rate (for each day)
    const hrRes = await fetch(
      `https://api.fitbit.com/1/user/-/activities/heart/date/${startDate}/${endDate}.json`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const hrByDate: Record<string, number> = {};
    if (hrRes.ok) {
      const hrData = await hrRes.json();
      for (const entry of hrData["activities-heart"] ?? []) {
        if (entry.value?.restingHeartRate) {
          hrByDate[entry.dateTime] = entry.value.restingHeartRate;
        }
      }
    }

    // Fetch daily calories burned (activity summary)
    const caloriesByDate: Record<string, number> = {};
    const actRes = await fetch(
      `https://api.fitbit.com/1/user/-/activities/calories/date/${startDate}/${endDate}.json`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (actRes.ok) {
      const actData = await actRes.json();
      for (const entry of actData["activities-calories"] ?? []) {
        if (entry.value) {
          caloriesByDate[entry.dateTime] = parseFloat(entry.value);
        }
      }
    }

    // Upsert recovery_daily for each date
    for (const date of dates) {
      const sleep = sleepByDate[date];
      const rhr = hrByDate[date];
      const calsOut = caloriesByDate[date];

      if (!sleep && !rhr && !calsOut) continue;

      const { error: upsertError } = await supabase
        .from("recovery_daily")
        .upsert(
          {
            athlete_id: user.id,
            date,
            source: "fitbit",
            sleep_start: sleep?.startTime ?? null,
            sleep_end: sleep?.endTime ?? null,
            sleep_minutes: sleep?.minutes ?? null,
            sleep_score: sleep?.score ?? null,
            resting_hr: rhr ?? null,
            hrv_ms: null, // Fitbit HRV requires special endpoint
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
      { error: "Failed to sync Fitbit data", detail: String(err) },
      { status: 502 }
    );
  }
}

/** Refresh an expired Fitbit access token */
async function refreshFitbitToken(
  refreshToken: string | null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  service: any,
  userId: string
): Promise<string | null> {
  if (!refreshToken) return null;

  const clientId = process.env.FITBIT_CLIENT_ID ?? "";
  const clientSecret = process.env.FITBIT_CLIENT_SECRET ?? "";

  const res = await fetch("https://api.fitbit.com/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) return null;

  const tokens = await res.json();

  await service
    .from("integration_connections")
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? refreshToken,
      expires_at: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null,
    })
    .eq("athlete_id", userId)
    .eq("provider", "fitbit");

  return tokens.access_token;
}
