import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const FITBIT_CLIENT_ID = process.env.FITBIT_CLIENT_ID;
const FITBIT_REDIRECT_URL = process.env.FITBIT_REDIRECT_URL;

/**
 * GET /api/integrations/fitbit/authorize
 * Redirects the user to Fitbit's OAuth 2.0 authorization page.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!FITBIT_CLIENT_ID || !FITBIT_REDIRECT_URL) {
    return NextResponse.json(
      { error: "Fitbit integration not configured. Set FITBIT_CLIENT_ID and FITBIT_REDIRECT_URL." },
      { status: 503 }
    );
  }

  const scopes = [
    "sleep",
    "heartrate",
    "activity",
    "profile",
  ].join("+");

  const authUrl = new URL("https://www.fitbit.com/oauth2/authorize");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", FITBIT_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", FITBIT_REDIRECT_URL);
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("state", user.id); // pass user id to callback

  return NextResponse.redirect(authUrl.toString());
}
