import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/meals?athleteId=...&from=YYYY-MM-DD&to=YYYY-MM-DD
 * Returns meal logs for the active athlete, optionally filtered by date range.
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

  let query = supabase
    .from("meal_logs")
    .select("*")
    .eq("athlete_id", athleteId)
    .order("logged_at", { ascending: false });

  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (from) query = query.gte("logged_at", `${from}T00:00:00`);
  if (to) query = query.lte("logged_at", `${to}T23:59:59`);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

/**
 * POST /api/meals
 * Create a meal log.
 * Body: { mealName, mealType?, loggedAt?, calories?, proteinG?, carbsG?, fatG?, fiberG?, edamamFoodJson?, notes? }
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    mealName,
    mealType,
    loggedAt,
    calories,
    proteinG,
    carbsG,
    fatG,
    fiberG,
    edamamFoodJson,
    notes,
  } = body;

  if (!mealName) {
    return NextResponse.json({ error: "mealName is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("meal_logs")
    .insert({
      athlete_id: user.id,
      meal_name: mealName,
      meal_type: mealType ?? null,
      logged_at: loggedAt ? new Date(loggedAt).toISOString() : new Date().toISOString(),
      calories: calories ?? null,
      protein_g: proteinG ?? null,
      carbs_g: carbsG ?? null,
      fat_g: fatG ?? null,
      fiber_g: fiberG ?? null,
      edamam_food_json: edamamFoodJson ?? null,
      notes: notes?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
