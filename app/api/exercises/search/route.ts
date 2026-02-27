import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/exercises/search?q=...
 * Searches the wger exercise database and returns normalized results.
 * Uses the public wger API v2 (no API key required).
 */
export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ error: "q parameter is required" }, { status: 400 });
  }

  try {
    // wger API v2: search exercises (English, format=json)
    const wgerRes = await fetch(
      `https://wger.de/api/v2/exercise/search/?term=${encodeURIComponent(query)}&language=english&format=json`,
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 3600 }, // Cache wger responses for 1 hour
      }
    );

    if (!wgerRes.ok) {
      // Fallback: try the exercise list endpoint with name filter
      const fallbackRes = await fetch(
        `https://wger.de/api/v2/exercise/?language=2&format=json&limit=20&offset=0`,
        {
          headers: { Accept: "application/json" },
          next: { revalidate: 3600 },
        }
      );

      if (!fallbackRes.ok) {
        return NextResponse.json({ error: "wger API unavailable" }, { status: 502 });
      }

      const fallbackData = await fallbackRes.json();
      const exercises = normalizeWgerList(fallbackData.results ?? []);
      const filtered = exercises.filter((e) =>
        e.name.toLowerCase().includes(query.toLowerCase())
      );
      return NextResponse.json({ exercises: filtered });
    }

    const data = await wgerRes.json();

    // The search endpoint returns { suggestions: [...] }
    const suggestions = data.suggestions ?? [];
    const exercises = suggestions.map((s: WgerSearchSuggestion) => ({
      providerExerciseId: String(s.data?.id ?? s.id ?? ""),
      name: s.data?.name ?? s.name ?? "Unknown",
      category: getCategoryFromId(s.data?.category) ?? null,
      muscles: (s.data?.muscles ?? []).map((m: WgerMuscle) => m.name_en ?? m.name ?? ""),
      equipment: (s.data?.equipment ?? []).map((e: WgerEquipment) => e.name ?? ""),
      description: s.data?.description ?? null,
    }));

    return NextResponse.json({ exercises });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to search exercises", detail: String(err) },
      { status: 502 }
    );
  }
}

// ── Helper types & functions ──────────────────────────────────

interface WgerSearchSuggestion {
  id?: number;
  name?: string;
  data?: {
    id?: number;
    name?: string;
    category?: number | { name?: string };
    muscles?: WgerMuscle[];
    equipment?: WgerEquipment[];
    description?: string;
  };
}

interface WgerMuscle {
  name?: string;
  name_en?: string;
}

interface WgerEquipment {
  name?: string;
}

interface WgerExercise {
  id?: number;
  name?: string;
  category?: number;
  muscles?: number[];
  equipment?: number[];
  description?: string;
}

/** Normalize the list endpoint format */
function normalizeWgerList(results: WgerExercise[]) {
  return results
    .filter((e) => e.name && e.name.trim())
    .map((e) => ({
      providerExerciseId: String(e.id ?? ""),
      name: e.name ?? "Unknown",
      category: getCategoryFromId(e.category) ?? null,
      muscles: [] as string[],
      equipment: [] as string[],
      description: e.description ?? null,
    }));
}

/** Map wger category IDs to readable names */
function getCategoryFromId(catId: number | { name?: string } | undefined | null): string | null {
  if (!catId) return null;
  if (typeof catId === "object") return catId.name ?? null;
  const map: Record<number, string> = {
    8: "Arms",
    9: "Legs",
    10: "Abs",
    11: "Chest",
    12: "Back",
    13: "Shoulders",
    14: "Calves",
    15: "Cardio",
  };
  return map[catId] ?? null;
}
