import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function getServiceSupabase() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) return null;
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  );
}

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
    const { data: assignment } = await supabase
      .from("psychologist_athletes")
      .select("psychologist_id, created_at, psychologist:psychologist_id(id, name, email)")
      .eq("athlete_id", user.id)
      .single();

    return NextResponse.json({ psychologist: assignment?.psychologist ?? null });
  } else if (profile?.role === "PSYCHOLOGIST") {
    const serviceSupabase = getServiceSupabase();
    if (!serviceSupabase) {
      return NextResponse.json({ error: "Service role key not configured" }, { status: 500 });
    }

    const { data: assignments, error } = await serviceSupabase
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
 * - Psychologist: assign an athlete to self (body: { athleteName, athleteEmail })
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
    const { psychologistId } = body;
    if (!psychologistId) {
      return NextResponse.json(
        { error: "psychologistId is required" },
        { status: 400 }
      );
    }

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
    const serviceSupabase = getServiceSupabase();
    if (!serviceSupabase) {
      return NextResponse.json(
        { error: "Service role key not configured" },
        { status: 500 }
      );
    }

    let athleteId = body.athleteId as string | undefined;

    if (!athleteId && body.athleteEmail) {
      const providedName = String(body.athleteName ?? "").trim();
      if (!providedName) {
        return NextResponse.json(
          { error: "athleteName is required when using athleteEmail" },
          { status: 400 }
        );
      }

      const emailNorm = body.athleteEmail.trim().toLowerCase();

      const athleteProfile = await serviceSupabase
        .from("profiles")
        .select("id, name, email")
        .ilike("email", emailNorm)
        .eq("role", "ATHLETE")
        .maybeSingle()
        .then((r) => r.data);

      if (!athleteProfile?.id) {
        // Not in profiles — may exist only in auth.users
        const { data: list } = await serviceSupabase.auth.admin.listUsers({
          perPage: 1000,
        });
        const authUser = list?.users?.find(
          (u) => u.email?.toLowerCase() === emailNorm
        );
        if (authUser) {
          const authName =
            (authUser.user_metadata?.name as string | undefined) ??
            (authUser.user_metadata?.full_name as string | undefined) ??
            "";
          if (authName && authName.trim().toLowerCase() !== providedName.toLowerCase()) {
            return NextResponse.json(
              { error: "Name does not match the athlete account for that email" },
              { status: 400 }
            );
          }

          await serviceSupabase.from("profiles").upsert(
            {
              id: authUser.id,
              email: authUser.email ?? emailNorm,
              name: authName?.trim() || providedName || authUser.email || "User",
              role: "ATHLETE",
            },
            { onConflict: "id" }
          );
          await serviceSupabase.from("athlete_profiles").upsert(
            { user_id: authUser.id },
            { onConflict: "user_id" }
          );
          athleteId = authUser.id;
        }
      } else {
        const existingName = String(athleteProfile.name ?? "").trim();
        if (existingName && existingName.toLowerCase() !== providedName.toLowerCase()) {
          return NextResponse.json(
            { error: "Name does not match the athlete record for that email" },
            { status: 400 }
          );
        }
        athleteId = athleteProfile.id;
      }

      if (!athleteId) {
        return NextResponse.json(
          { error: "No athlete account found with that email" },
          { status: 404 }
        );
      }
    }

    if (!athleteId) {
      return NextResponse.json(
        { error: "athleteId or athleteEmail is required" },
        { status: 400 }
      );
    }

    const { data: existingRows, error: lookupError } = await serviceSupabase
      .from("psychologist_athletes")
      .select("psychologist_id")
      .eq("athlete_id", athleteId);

    if (lookupError) {
      return NextResponse.json({ error: lookupError.message }, { status: 500 });
    }

    if (existingRows && existingRows.length > 1) {
      return NextResponse.json(
        { error: "Data integrity error: multiple assignment rows for the same athlete" },
        { status: 500 }
      );
    }

    const existingAssignment = existingRows?.[0];

    if (existingAssignment) {
      if (existingAssignment.psychologist_id === user.id) {
        return NextResponse.json(
          { psychologist_id: user.id, athlete_id: athleteId },
          { status: 200 }
        );
      }

      const { data: updated, error: updateError } = await serviceSupabase
        .from("psychologist_athletes")
        .update({ psychologist_id: user.id })
        .eq("athlete_id", athleteId)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json(updated, { status: 200 });
    }

    const { data, error } = await serviceSupabase
      .from("psychologist_athletes")
      .insert({
        psychologist_id: user.id,
        athlete_id: athleteId,
      })
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
    const { error } = await supabase
      .from("psychologist_athletes")
      .delete()
      .eq("athlete_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } else if (profile?.role === "PSYCHOLOGIST") {
    const { searchParams } = new URL(req.url);
    const athleteId = searchParams.get("athleteId");

    if (!athleteId) {
      return NextResponse.json(
        { error: "athleteId query parameter is required" },
        { status: 400 }
      );
    }

    // Use service role to bypass RLS for the assignment delete
    const serviceSupabase = getServiceSupabase();
    if (!serviceSupabase) {
      return NextResponse.json(
        { error: "Service role key not configured" },
        { status: 500 }
      );
    }

    const { error } = await serviceSupabase
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
