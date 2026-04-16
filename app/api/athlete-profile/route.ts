import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/athlete-profile
 * Returns the current athlete's profile (sport, position, team, bodyweight_kg).
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("athlete_profiles")
    .select("user_id, sport, position, team, bodyweight_kg")
    .eq("user_id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

/**
 * PATCH /api/athlete-profile
 * Updates athlete profile fields (sport, position, team, bodyweight_kg).
 */
export async function PATCH(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const updates: Record<string, unknown> = {};

  if (body.sport !== undefined) updates.sport = body.sport || null;
  if (body.position !== undefined) updates.position = body.position || null;
  if (body.team !== undefined) updates.team = body.team || null;
  if (body.bodyweightKg !== undefined) {
    updates.bodyweight_kg = body.bodyweightKg != null && body.bodyweightKg > 0
      ? body.bodyweightKg
      : null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("athlete_profiles")
    .update(updates)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
