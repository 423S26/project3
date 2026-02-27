import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const FITBIT_CLIENT_ID = process.env.FITBIT_CLIENT_ID ?? "";
const FITBIT_CLIENT_SECRET = process.env.FITBIT_CLIENT_SECRET ?? "";
const FITBIT_REDIRECT_URL = process.env.FITBIT_REDIRECT_URL ?? "";

/**
 * GET /api/integrations/fitbit/callback?code=...&state=...
 * Exchanges the OAuth code for tokens and stores them server-side.
 */
export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      new URL(`/physical-state?integration_error=${error ?? "no_code"}`, req.url)
    );
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://api.fitbit.com/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: FITBIT_REDIRECT_URL,
      }),
    });

    if (!tokenRes.ok) {
      const detail = await tokenRes.text();
      console.error("Fitbit token exchange failed:", detail);
      return NextResponse.redirect(
        new URL("/physical-state?integration_error=token_exchange_failed", req.url)
      );
    }

    const tokens = await tokenRes.json();

    // Store tokens server-side (service role bypasses RLS)
    const service = createServiceClient();
    const { error: dbError } = await service
      .from("integration_connections")
      .upsert(
        {
          athlete_id: user.id,
          provider: "fitbit",
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token ?? null,
          expires_at: tokens.expires_in
            ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
            : null,
          scope: tokens.scope ?? null,
        },
        { onConflict: "athlete_id,provider" }
      );

    if (dbError) {
      console.error("Failed to store Fitbit tokens:", dbError);
      return NextResponse.redirect(
        new URL("/physical-state?integration_error=db_error", req.url)
      );
    }

    return NextResponse.redirect(
      new URL("/physical-state?integration_success=fitbit", req.url)
    );
  } catch (err) {
    console.error("Fitbit callback error:", err);
    return NextResponse.redirect(
      new URL("/physical-state?integration_error=unknown", req.url)
    );
  }
}
