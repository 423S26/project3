import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  if (profile?.role !== "PSYCHOLOGIST") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("psychologist_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
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
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const fields: Record<string, unknown> = {};

  if (body.school !== undefined) fields.school = body.school || null;
  if (body.degree !== undefined) fields.degree = body.degree || null;
  if (body.certifications !== undefined) fields.certifications = body.certifications || null;
  if (body.phone !== undefined) fields.phone = body.phone || null;
  if (body.officeLocation !== undefined) fields.office_location = body.officeLocation || null;
  if (body.bio !== undefined) fields.bio = body.bio || null;

  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("psychologist_profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  let data, error;

  if (existing) {
    ({ data, error } = await supabase
      .from("psychologist_profiles")
      .update(fields)
      .eq("user_id", user.id)
      .select()
      .single());
  } else {
    ({ data, error } = await supabase
      .from("psychologist_profiles")
      .insert({ user_id: user.id, ...fields })
      .select()
      .single());
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
