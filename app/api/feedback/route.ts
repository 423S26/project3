import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { headers } from "next/headers";

/**
 * In-memory rate limit store.
 * Limits each IP to MAX_REQUESTS submissions within WINDOW_MS.
 * Resets automatically when the server process restarts.
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 10;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  if (entry.count >= MAX_REQUESTS) return true;

  entry.count += 1;
  return false;
}

const VALID_CATEGORIES = ["setup", "ux", "docs", "question", "bug", "other"] as const;
const VALID_SEVERITIES = ["low", "medium", "high", "blocking"] as const;

/**
 * POST /api/feedback
 * Accepts a user feedback report and writes it to `public.feedback_reports`
 * using the service-role client (bypasses RLS so anonymous/auth users both work).
 * The authenticated user's ID is attached when a session cookie is present.
 */
export async function POST(req: Request) {
  // Rate limit by IP
  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429 }
    );
  }

  // Parse body
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { category, severity, message, what_were_you_trying, page_path } = body as {
    category?: string;
    severity?: string;
    message?: string;
    what_were_you_trying?: string;
    page_path?: string;
  };

  // Validate required fields
  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json({ error: "message is required." }, { status: 400 });
  }

  if (!category || !VALID_CATEGORIES.includes(category as (typeof VALID_CATEGORIES)[number])) {
    return NextResponse.json(
      { error: `category must be one of: ${VALID_CATEGORIES.join(", ")}` },
      { status: 400 }
    );
  }

  if (!severity || !VALID_SEVERITIES.includes(severity as (typeof VALID_SEVERITIES)[number])) {
    return NextResponse.json(
      { error: `severity must be one of: ${VALID_SEVERITIES.join(", ")}` },
      { status: 400 }
    );
  }

  // Attempt to resolve the authenticated user (no error if unauthenticated)
  let userId: string | null = null;
  let userRole: string | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      userId = user.id;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      userRole = profile?.role ?? null;
    }
  } catch {
    // Non-fatal: proceed without user context
  }

  // Build optional metadata
  const userAgent = headersList.get("user-agent") ?? undefined;
  const metadata: Record<string, unknown> = {};
  if (userAgent) metadata.user_agent = userAgent;

  // Insert using service-role client (bypasses RLS; our validation above is the gate)
  const service = createServiceClient();
  const { error } = await service.from("feedback_reports").insert({
    user_id: userId,
    user_role: userRole,
    page_path: typeof page_path === "string" ? page_path.slice(0, 500) : "",
    category,
    severity,
    message: message.trim().slice(0, 5000),
    what_were_you_trying: typeof what_were_you_trying === "string"
      ? what_were_you_trying.trim().slice(0, 2000)
      : "",
    metadata: Object.keys(metadata).length > 0 ? metadata : null,
  });

  if (error) {
    console.error("feedback insert error:", error);
    return NextResponse.json({ error: "Failed to save feedback." }, { status: 500 });
  }

  return NextResponse.json({ message: "Feedback submitted. Thank you!" }, { status: 201 });
}
