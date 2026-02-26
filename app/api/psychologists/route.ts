import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/psychologists
 * Returns list of psychologists (for athlete to choose from).
 * Only accessible by athletes.
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

  if (profile?.role !== "ATHLETE") {
    return NextResponse.json(
      { error: "Only athletes can list psychologists" },
      { status: 403 }
    );
  }

  // Fetch psychologists (RLS allows athletes to see psychologist profiles)
  const { data: psychologists, error } = await supabase
    .from("profiles")
    .select("id, name, email")
    .eq("role", "PSYCHOLOGIST")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(psychologists ?? []);
}
