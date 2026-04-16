import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/exercises/save
 * Persists a wger exercise into the exercise_library cache table.
 * Uses upsert on (provider, provider_exercise_id) so repeated saves are idempotent.
 *
 * Body: {
 *   providerExerciseId: string,
 *   name: string,
 *   category?: string,
 *   muscles?: string[],
 *   equipment?: string[],
 *   description?: string
 * }
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
  const { providerExerciseId, name, category, muscles, equipment, description } = body;

  if (!providerExerciseId || !name) {
    return NextResponse.json(
      { error: "providerExerciseId and name are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("exercise_library")
    .upsert(
      {
        provider: "wger",
        provider_exercise_id: String(providerExerciseId),
        name,
        category: category ?? null,
        muscles: muscles ?? [],
        equipment: equipment ?? [],
        description: description ?? null,
      },
      { onConflict: "provider,provider_exercise_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
