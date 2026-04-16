import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const EDAMAM_APP_ID = process.env.EDAMAM_APP_ID;
const EDAMAM_APP_KEY = process.env.EDAMAM_APP_KEY;

/**
 * GET /api/edamam/search?q=chicken+breast
 * Proxies food search to Edamam Food Database API.
 * Requires EDAMAM_APP_ID and EDAMAM_APP_KEY env vars.
 */
export async function GET(req: Request) {
  // Auth check – only authenticated users can search
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!EDAMAM_APP_ID || !EDAMAM_APP_KEY) {
    return NextResponse.json(
      { error: "Edamam API is not configured. Set EDAMAM_APP_ID and EDAMAM_APP_KEY." },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");
  if (!query || query.trim().length === 0) {
    return NextResponse.json({ error: "query parameter 'q' is required" }, { status: 400 });
  }

  try {
    const edamamUrl = new URL("https://api.edamam.com/api/food-database/v2/parser");
    edamamUrl.searchParams.set("app_id", EDAMAM_APP_ID);
    edamamUrl.searchParams.set("app_key", EDAMAM_APP_KEY);
    edamamUrl.searchParams.set("ingr", query.trim());
    edamamUrl.searchParams.set("nutrition-type", "logging");

    const res = await fetch(edamamUrl.toString(), {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Edamam API error: ${res.status}`, detail: text },
        { status: res.status }
      );
    }

    const data = await res.json();

    // Normalize to a simpler shape for the client
    interface EdamamHint {
      food: {
        foodId: string;
        label: string;
        image?: string;
        nutrients: {
          ENERC_KCAL?: number;
          PROCNT?: number;
          CHOCDF?: number;
          FAT?: number;
          FIBTG?: number;
        };
        brand?: string;
        category?: string;
      };
    }

    const foods = (data.hints ?? []).slice(0, 20).map((hint: EdamamHint) => {
      const f = hint.food;
      return {
        foodId: f.foodId,
        label: f.label,
        image: f.image ?? null,
        brand: f.brand ?? null,
        category: f.category ?? null,
        nutrients: {
          calories: f.nutrients?.ENERC_KCAL ?? null,
          protein: f.nutrients?.PROCNT ?? null,
          carbs: f.nutrients?.CHOCDF ?? null,
          fat: f.nutrients?.FAT ?? null,
          fiber: f.nutrients?.FIBTG ?? null,
        },
      };
    });

    return NextResponse.json({ foods });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to reach Edamam API", detail: String(err) },
      { status: 502 }
    );
  }
}
