import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const MAX_IMAGES = 4;
const MAX_BODY_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * The system prompt instructs the model to act as a supportive AI coach,
 * parse screenshots of schedules / lifting plans / meal plans, and return
 * structured `suggested_actions` that match Anchor's existing POST endpoints.
 *
 * Payload shapes (camelCase, matching the client helpers in physical-state-api.ts):
 *
 *   workout_template  → POST /api/workouts/templates
 *     { name, sport?, type?, exercises?: [{ exerciseName, defaultSets?, defaultReps?, defaultWeightKg? }] }
 *
 *   meal_log          → POST /api/meals
 *     { mealName, mealType?, loggedAt?, calories?, proteinG?, carbsG?, fatG?, fiberG?, notes? }
 *
 *   recovery_entry    → POST /api/recovery
 *     { date, sleepMinutes?, sleepScore?, restingHr?, hrvMs?, notes? }
 */
const SYSTEM_PROMPT = `You are the Anchor AI Coach — a supportive assistant for athletes using the Anchor sports-psychology app.

What you help with:
1. Check-ins — explain mood/energy/stress scores (1-10 scale), suggest reflections, ask follow-up questions.
2. Motivation & planning — suggest goals for the week, turn coach instructions into daily tasks.
3. Education — app usage tips, basic sports-psych concepts, session preparation.
4. Message drafts — help athletes draft messages to their psychologist (they send the final version).
5. Screenshot import — when the athlete shares a screenshot of a schedule, lifting plan, meal plan, etc., describe what you see and extract structured data so the app can import it.

Safety rules:
- You are an AI assistant, NOT a psychologist. Never give medical or diagnostic advice.
- Encourage contacting a real psychologist for serious or clinical concerns.
- Be concise, warm, and practical.

When you can extract structured data from an image or a user request, include a single JSON code block with this exact shape:
\`\`\`json
{"suggested_actions":[...]}
\`\`\`

Each item must be one of these three types with the EXACT payload shapes shown:

Type "workout_template":
{"type":"workout_template","payload":{"name":"string","sport":"string (optional)","type":"strength or sport_session (optional)","exercises":[{"exerciseName":"string","defaultSets":3,"defaultReps":10,"defaultWeightKg":50}]}}

Type "meal_log":
{"type":"meal_log","payload":{"mealName":"string","mealType":"breakfast|lunch|dinner|snack|pre_workout|post_workout (optional)","loggedAt":"ISO datetime (optional)","calories":500,"proteinG":30,"carbsG":60,"fatG":15,"fiberG":5,"notes":"string (optional)"}}

Type "recovery_entry":
{"type":"recovery_entry","payload":{"date":"YYYY-MM-DD","sleepMinutes":480,"sleepScore":85,"restingHr":55,"hrvMs":45,"notes":"string (optional)"}}

Only include the JSON block when you actually extracted structured data. You may output multiple items in the array. Outside the JSON block, write a normal human-readable explanation.`;

export type SuggestedActionType = "workout_template" | "meal_log" | "recovery_entry";

export interface SuggestedAction {
  type: SuggestedActionType;
  payload: Record<string, unknown>;
}

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
      { error: "Practice Lab is for athletes only" },
      { status: 403 }
    );
  }

  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "AI coach is not configured. Set OPENAI_API_KEY." },
      { status: 503 }
    );
  }

  const contentLength = parseInt(req.headers.get("content-length") ?? "0", 10);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: `Request body too large (max ${MAX_BODY_BYTES / 1024 / 1024} MB)` },
      { status: 413 }
    );
  }

  let body: { message?: string; imageBase64?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  const imageBase64 = Array.isArray(body.imageBase64)
    ? body.imageBase64
        .filter((s): s is string => typeof s === "string" && s.length > 0)
        .slice(0, MAX_IMAGES)
    : [];

  if (!message && imageBase64.length === 0) {
    return NextResponse.json(
      { error: "message or at least one image is required" },
      { status: 400 }
    );
  }

  // Athlete context for personalization
  const [profileRow, checkInsRow] = await Promise.all([
    supabase
      .from("athlete_profiles")
      .select("sport, position, team, bodyweight_kg")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("check_ins")
      .select("mood, stress, motivation, notes, created_at")
      .eq("athlete_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const contextParts: string[] = [];
  if (profileRow.data) {
    const p = profileRow.data;
    const info = [p.sport, p.position, p.team].filter(Boolean);
    if (info.length) contextParts.push(`Sport/position/team: ${info.join(", ")}`);
    if (p.bodyweight_kg != null) contextParts.push(`Bodyweight: ${p.bodyweight_kg} kg`);
  }
  if (checkInsRow.data?.length) {
    contextParts.push(
      "Recent check-ins (mood, stress, motivation; 1-10): " +
        checkInsRow.data
          .map(
            (c) =>
              `[${new Date(c.created_at).toLocaleDateString()}] mood ${c.mood}, stress ${c.stress}, motivation ${c.motivation}${c.notes ? ` — ${c.notes}` : ""}`
          )
          .join("; ")
    );
  }
  const contextBlock =
    contextParts.length > 0
      ? `\n\nCurrent athlete context:\n${contextParts.join("\n")}`
      : "";

  // Build the user message content parts
  const userContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];

  if (message) {
    userContent.push({ type: "text", text: message + contextBlock });
  } else if (contextBlock) {
    userContent.push({ type: "text", text: `(image attached)${contextBlock}` });
  }

  for (const b64 of imageBase64) {
    const dataUrl = b64.startsWith("data:") ? b64 : `data:image/png;base64,${b64}`;
    userContent.push({ type: "image_url", image_url: { url: dataUrl } });
  }

  try {
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      max_tokens: 1500,
    });

    const rawReply = completion.choices[0]?.message?.content?.trim() ?? "";

    // Extract suggested_actions from a ```json ... ``` block
    let suggestedActions: SuggestedAction[] = [];
    const jsonBlock = rawReply.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonBlock) {
      try {
        const parsed = JSON.parse(jsonBlock[1].trim()) as {
          suggested_actions?: Array<{ type: string; payload: Record<string, unknown> }>;
        };
        if (Array.isArray(parsed.suggested_actions)) {
          const validTypes: SuggestedActionType[] = [
            "workout_template",
            "meal_log",
            "recovery_entry",
          ];
          suggestedActions = parsed.suggested_actions.filter(
            (a): a is SuggestedAction =>
              typeof a.type === "string" &&
              validTypes.includes(a.type as SuggestedActionType) &&
              a.payload != null &&
              typeof a.payload === "object"
          );
        }
      } catch {
        // JSON parse failed — ignore and return raw reply
      }
    }

    // Strip the JSON block from the human-readable reply
    const reply =
      jsonBlock && suggestedActions.length > 0
        ? rawReply.replace(/\s*```(?:json)?\s*[\s\S]*?```\s*/g, "").trim()
        : rawReply;

    return NextResponse.json({
      reply:
        reply ||
        "I extracted some suggestions you can review below. Let me know if you'd like to adjust anything before applying.",
      suggestedActions: suggestedActions.length > 0 ? suggestedActions : undefined,
    });
  } catch (err) {
    console.error("OpenAI coach error:", err);
    const openaiErr = err as { status?: number; code?: string; message?: string };
    if (openaiErr.status === 429 || openaiErr.code === "insufficient_quota") {
      return NextResponse.json(
        { error: "The AI coach has no available credits. Please add billing at platform.openai.com." },
        { status: 402 }
      );
    }
    if (openaiErr.status === 401 || openaiErr.code === "invalid_api_key") {
      return NextResponse.json(
        { error: "OpenAI API key is invalid. Check OPENAI_API_KEY in your environment." },
        { status: 502 }
      );
    }
    return NextResponse.json(
      {
        error: "Failed to get AI response",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 502 }
    );
  }
}
