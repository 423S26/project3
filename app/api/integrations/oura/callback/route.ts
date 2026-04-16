import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const OURA_CLIENT_ID = process.env.OURA_CLIENT_ID ?? "";
const OURA_CLIENT_SECRET = process.env.OURA_CLIENT_SECRET ?? "";
const OURA_REDIRECT_URL = process.env.OURA_REDIRECT_URL ?? "";

/**
 * GET /api/integrations/oura/callback?code=...&state=...
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
    const tokenRes = await fetch("https://api.ouraring.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: OURA_REDIRECT_URL,
        client_id: OURA_CLIENT_ID,
        client_secret: OURA_CLIENT_SECRET,
      }),
    });

    if (!tokenRes.ok) {
      const detail = await tokenRes.text();
      console.error("Oura token exchange failed:", detail);
      return NextResponse.redirect(
        new URL("/physical-state?integration_error=token_exchange_failed", req.url)
      );
    }

    const tokens = await tokenRes.json();

    const service = createServiceClient();
    const { error: dbError } = await service
      .from("integration_connections")
      .upsert(
        {
          athlete_id: user.id,
          provider: "oura",
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
      console.error("Failed to store Oura tokens:", dbError);
      return NextResponse.redirect(
        new URL("/physical-state?integration_error=db_error", req.url)
      );
    }

    return NextResponse.redirect(
      new URL("/physical-state?integration_success=oura", req.url)
    );
  } catch (err) {
    console.error("Oura callback error:", err);
    return NextResponse.redirect(
      new URL("/physical-state?integration_error=unknown", req.url)
    );
  }
}
