import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/psychologist/checkins
 * Returns check-ins across all assigned athletes (caseload calendar).
 *
 * Query params (all optional):
 *   athleteId  – filter to a single athlete
 *   date       – YYYY-MM-DD (shorthand for from/to of that day)
 *   from       – ISO or YYYY-MM-DD lower bound
 *   to         – ISO or YYYY-MM-DD upper bound
 *   limit      – max rows returned
 *   order      – "asc" (default) or "desc"
 *
 * Only accessible by psychologists. RLS scopes rows to assigned athletes.
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

  if (profile?.role !== "PSYCHOLOGIST") {
    return NextResponse.json(
      { error: "Only psychologists can access caseload check-ins" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const athleteIdParam = searchParams.get("athleteId");
  const dateParam = searchParams.get("date");
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const limitParam = searchParams.get("limit");
  const orderParam = searchParams.get("order"); // "asc" | "desc"

  const ascending = orderParam !== "desc";

  let query = supabase
    .from("check_ins")
    .select("*, athlete:athlete_id(id, name, email)")
    .order("created_at", { ascending });

  if (athleteIdParam) {
    query = query.eq("athlete_id", athleteIdParam);
  }

  // Date range helpers
  function dayStart(ymd: string): string {
    const [y, m, d] = ymd.split("-").map(Number);
    return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString();
  }
  function dayEnd(ymd: string): string {
    const [y, m, d] = ymd.split("-").map(Number);
    return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
  }

  if (dateParam) {
    query = query.gte("created_at", dayStart(dateParam)).lte("created_at", dayEnd(dateParam));
  } else {
    if (fromParam) {
      const gte = fromParam.length === 10 ? dayStart(fromParam) : fromParam;
      query = query.gte("created_at", gte);
    }
    if (toParam) {
      const lte = toParam.length === 10 ? dayEnd(toParam) : toParam;
      query = query.lte("created_at", lte);
    }
  }

  if (limitParam) {
    const n = parseInt(limitParam, 10);
    if (!isNaN(n) && n > 0) {
      query = query.limit(n);
    }
  }

  const { data: checkIns, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const result = (checkIns ?? []).map((ci) => ({
    id: ci.id,
    athleteId: ci.athlete_id,
    athleteName: ci.athlete?.name ?? "Unknown",
    athleteEmail: ci.athlete?.email ?? "",
    mood: ci.mood,
    stress: ci.stress,
    motivation: ci.motivation,
    notes: ci.notes,
    brums: ci.brums_json
      ? {
          completed: true,
          items: ci.brums_json,
          subscales: ci.brums_subscales_json ?? null,
        }
      : undefined,
    createdAt: ci.created_at,
  }));

  return NextResponse.json(result);
}
