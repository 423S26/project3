import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computePreGameScore } from "@/lib/pre-game-assessment";

/**
 * GET /api/assessments?athleteId=...
 * Athletes: returns own assessments.
 * Psychologists: requires athleteId, returns that athlete's assessments.
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

  const { data: assessments, error } = await supabase
    .from("assessments")
    .select(
      "id, athlete_id, psychologist_id, template_key, status, due_at, answers, score, created_at, updated_at, psychologist:psychologist_id(name, email), athlete:athlete_id(name, email)"
    )
    .eq("athlete_id", athleteId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(assessments ?? []);
}

/**
 * POST /api/assessments
 * Psychologist assigns a pre-game assessment to one athlete.
 * Body: { athleteId, dueAt? }
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

  if (profile?.role !== "PSYCHOLOGIST") {
    return NextResponse.json(
      { error: "Only psychologists can assign assessments" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { athleteId, dueAt } = body;

  if (!athleteId) {
    return NextResponse.json(
      { error: "athleteId is required" },
      { status: 400 }
    );
  }

  const { data: assignment } = await supabase
    .from("psychologist_athletes")
    .select("athlete_id")
    .eq("psychologist_id", user.id)
    .eq("athlete_id", athleteId)
    .maybeSingle();

  if (!assignment) {
    return NextResponse.json(
      { error: "Athlete is not in your caseload" },
      { status: 403 }
    );
  }

  const { data, error } = await supabase
    .from("assessments")
    .insert({
      athlete_id: athleteId,
      psychologist_id: user.id,
      template_key: "pre_game",
      due_at: dueAt ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

/**
 * PATCH /api/assessments?id=<assessment-id>
 * Athlete submits answers for an assigned assessment.
 * Body: { answers: { questionId: number, ... } }
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
  const assessmentId = searchParams.get("id");

  if (!assessmentId) {
    return NextResponse.json(
      { error: "id query parameter is required" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const { answers } = body;

  if (!answers || typeof answers !== "object") {
    return NextResponse.json(
      { error: "answers object is required" },
      { status: 400 }
    );
  }

  const score = computePreGameScore(answers);

  const { data, error } = await supabase
    .from("assessments")
    .update({
      answers,
      score,
      status: "completed",
    })
    .eq("id", assessmentId)
    .eq("athlete_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
