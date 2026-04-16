import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const OURA_CLIENT_ID = process.env.OURA_CLIENT_ID;
const OURA_REDIRECT_URL = process.env.OURA_REDIRECT_URL;

/**
 * GET /api/integrations/oura/authorize
 * Redirects the user to Oura's OAuth 2.0 authorization page.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!OURA_CLIENT_ID || !OURA_REDIRECT_URL) {
    return NextResponse.json(
      { error: "Oura integration not configured. Set OURA_CLIENT_ID and OURA_REDIRECT_URL." },
      { status: 503 }
    );
  }

  const authUrl = new URL("https://cloud.ouraring.com/oauth/authorize");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", OURA_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", OURA_REDIRECT_URL);
  authUrl.searchParams.set("scope", "daily sleep heartrate personal");
  authUrl.searchParams.set("state", user.id);

  return NextResponse.redirect(authUrl.toString());
}
