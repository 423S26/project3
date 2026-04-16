import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/goals?athleteId=...
 * Athletes: returns own goals (athleteId param ignored).
 * Psychologists: returns goals for the specified assigned athlete.
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
  const athleteId =
    profile?.role === "PSYCHOLOGIST"
      ? searchParams.get("athleteId")
      : user.id;

  if (!athleteId) {
    return NextResponse.json(
      { error: "athleteId query parameter is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("athlete_goals")
    .select("*")
    .eq("athlete_id", athleteId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

/**
 * POST /api/goals
 * Athletes create a new goal.
 * Body: { category, title, description?, targetValue?, currentValue? }
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

  if (profile?.role !== "ATHLETE") {
    return NextResponse.json(
      { error: "Only athletes can create goals" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { category, title, description, targetValue, currentValue } = body;

  if (!category || !title) {
    return NextResponse.json(
      { error: "category and title are required" },
      { status: 400 }
    );
  }

  const validCategories = ["weight", "performance", "training", "custom"];
  if (!validCategories.includes(category)) {
    return NextResponse.json(
      { error: `category must be one of: ${validCategories.join(", ")}` },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("athlete_goals")
    .insert({
      athlete_id: user.id,
      category,
      title,
      description: description ?? null,
      target_value: targetValue ?? null,
      current_value: currentValue ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

/**
 * PATCH /api/goals?id=<goal-id>
 * Athletes update their own goal fields (title, description, targetValue,
 * currentValue, status, category).
 */
export async function PATCH(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const goalId = searchParams.get("id");

  if (!goalId) {
    return NextResponse.json(
      { error: "id query parameter is required" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const updates: Record<string, unknown> = {};

  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.targetValue !== undefined) updates.target_value = body.targetValue;
  if (body.currentValue !== undefined) updates.current_value = body.currentValue;
  if (body.status !== undefined) updates.status = body.status;
  if (body.category !== undefined) updates.category = body.category;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("athlete_goals")
    .update(updates)
    .eq("id", goalId)
    .eq("athlete_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

/**
 * DELETE /api/goals?id=<goal-id>
 * Athletes delete their own goal.
 */
export async function DELETE(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const goalId = searchParams.get("id");

  if (!goalId) {
    return NextResponse.json(
      { error: "id query parameter is required" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("athlete_goals")
    .delete()
    .eq("id", goalId)
    .eq("athlete_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
