import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/checkins/import
 * Bulk-import check-ins from localStorage for the authenticated athlete.
 */
export async function POST(req: Request) {
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

  if (profile?.role !== "ATHLETE") {
    return NextResponse.json(
      { error: "Only athletes can import check-ins" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { checkIns } = body;

  if (!Array.isArray(checkIns) || checkIns.length === 0) {
    return NextResponse.json(
      { error: "checkIns array is required" },
      { status: 400 }
    );
  }

  let imported = 0;
  for (const ci of checkIns) {
    try {
      const { error } = await supabase.from("check_ins").insert({
        athlete_id: user.id,
        mood: Math.min(10, Math.max(1, ci.mood ?? 5)),
        stress: Math.min(10, Math.max(1, ci.stress ?? 5)),
        motivation: Math.min(10, Math.max(1, ci.motivation ?? 5)),
        notes: ci.notes?.trim() || null,
        brums_json: ci.brums?.items ?? null,
        brums_subscales_json: ci.brums?.subscales ?? null,
        created_at: ci.createdAt
          ? new Date(ci.createdAt).toISOString()
          : new Date().toISOString(),
      });
      if (!error) imported++;
    } catch {
      // Skip individual failures (e.g. duplicates)
    }
  }

  return NextResponse.json({ imported, total: checkIns.length });
}
