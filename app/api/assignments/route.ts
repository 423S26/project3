import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

/**
 * GET /api/assignments
 * Returns current user's assignment(s):
 * - Athlete: their assigned psychologist (if any)
 * - Psychologist: their caseload (list of assigned athletes)
 */
export async function GET() {
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

  if (profile?.role === "ATHLETE") {
    // Return athlete's psychologist (if assigned)
    const { data: assignment } = await supabase
      .from("psychologist_athletes")
      .select("psychologist_id, created_at, psychologist:psychologist_id(id, name, email)")
      .eq("athlete_id", user.id)
      .single();

    return NextResponse.json({ psychologist: assignment?.psychologist ?? null });
  } else if (profile?.role === "PSYCHOLOGIST") {
    // Return psychologist's caseload
    const { data: assignments, error } = await supabase
      .from("psychologist_athletes")
      .select("athlete_id, created_at, athlete:athlete_id(id, name, email, athlete_profiles(sport, position, team))")
      .eq("psychologist_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const caseload = (assignments ?? []).map((a) => ({
      athleteId: a.athlete_id,
      assignedAt: a.created_at,
      athlete: a.athlete,
    }));

    return NextResponse.json({ caseload });
  }

  return NextResponse.json({ error: "Invalid role" }, { status: 400 });
}

/**
 * POST /api/assignments
 * Create a new assignment:
 * - Athlete: assign self to a psychologist (body: { psychologistId })
 * - Psychologist: assign an athlete to self (body: { athleteId } OR { athleteEmail })
 */
export async function POST(req: Request) {
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

  const body = await req.json();

  if (profile?.role === "ATHLETE") {
    // Athlete assigning themselves to a psychologist
    const { psychologistId } = body;
    if (!psychologistId) {
      return NextResponse.json(
        { error: "psychologistId is required" },
        { status: 400 }
      );
    }

    // Upsert (replace existing assignment if any)
    const { data, error } = await supabase
      .from("psychologist_athletes")
      .upsert(
        {
          psychologist_id: psychologistId,
          athlete_id: user.id,
        },
        { onConflict: "athlete_id" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } else if (profile?.role === "PSYCHOLOGIST") {
    // Psychologist assigning an athlete to themselves
    let athleteId = body.athleteId;

    // If athleteEmail provided, look up athlete by email using service role
    if (!athleteId && body.athleteEmail) {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!serviceRoleKey) {
        return NextResponse.json(
          { error: "Service role key not configured" },
          { status: 500 }
        );
      }

      const serviceSupabase = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey
      );

      const { data: athleteProfile } = await serviceSupabase
        .from("profiles")
        .select("id")
        .ilike("email", body.athleteEmail.trim())
        .eq("role", "ATHLETE")
        .single();

      if (!athleteProfile) {
        return NextResponse.json(
          { error: "Athlete not found with that email" },
          { status: 404 }
        );
      }

      athleteId = athleteProfile.id;
    }

    if (!athleteId) {
      return NextResponse.json(
        { error: "athleteId or athleteEmail is required" },
        { status: 400 }
      );
    }

    // Insert assignment
    const { data, error } = await supabase
      .from("psychologist_athletes")
      .upsert(
        {
          psychologist_id: user.id,
          athlete_id: athleteId,
        },
        { onConflict: "athlete_id" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  }

  return NextResponse.json({ error: "Invalid role" }, { status: 400 });
}

/**
 * DELETE /api/assignments
 * Remove an assignment:
 * - Athlete: remove their psychologist assignment
 * - Psychologist: remove an athlete from their caseload (query param: athleteId)
 */
export async function DELETE(req: Request) {
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

  if (profile?.role === "ATHLETE") {
    // Athlete removing their psychologist
    const { error } = await supabase
      .from("psychologist_athletes")
      .delete()
      .eq("athlete_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } else if (profile?.role === "PSYCHOLOGIST") {
    // Psychologist removing an athlete from caseload
    const { searchParams } = new URL(req.url);
    const athleteId = searchParams.get("athleteId");

    if (!athleteId) {
      return NextResponse.json(
        { error: "athleteId query parameter is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("psychologist_athletes")
      .delete()
      .eq("psychologist_id", user.id)
      .eq("athlete_id", athleteId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid role" }, { status: 400 });
}
