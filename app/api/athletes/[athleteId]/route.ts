import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/athletes/[athleteId]
 * Returns profile info for a single athlete.
 * RLS enforces that psychologists can only access assigned athletes.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ athleteId: string }> }
) {
  const { athleteId } = await params;
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

  if (profile?.role !== "PSYCHOLOGIST") {
    return NextResponse.json(
      { error: "Only psychologists can view athlete details" },
      { status: 403 }
    );
  }

  // RLS will block if not assigned
  const { data: athlete, error } = await supabase
    .from("profiles")
    .select("id, name, email, role, athlete_profiles(sport, position, team)")
    .eq("id", athleteId)
    .eq("role", "ATHLETE")
    .single();

  if (error || !athlete) {
    return NextResponse.json(
      { error: "Athlete not found or not in your caseload" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    id: athlete.id,
    name: athlete.name,
    email: athlete.email,
    athleteProfile: athlete.athlete_profiles ?? null,
  });
}
