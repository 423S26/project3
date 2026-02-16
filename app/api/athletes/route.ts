import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/athletes
 * Returns list of athletes assigned to the requesting psychologist.
 * RLS policies automatically filter to only assigned athletes.
 * Only accessible by psychologists.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "PSYCHOLOGIST") {
    return NextResponse.json(
      { error: "Only psychologists can list athletes" },
      { status: 403 }
    );
  }

  // Fetch athletes with their athlete profiles
  const { data: athletes, error } = await supabase
    .from("profiles")
    .select("id, name, email, athlete_profiles(sport, position, team)")
    .eq("role", "ATHLETE")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Transform to match the previous API shape: athlete_profiles → athleteProfile
  const result = (athletes ?? []).map((a) => ({
    id: a.id,
    name: a.name,
    email: a.email,
    athleteProfile: a.athlete_profiles ?? null,
  }));

  return NextResponse.json(result);
}
