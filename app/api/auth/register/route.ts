import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/auth/register
 * Server-side registration endpoint (validates input then delegates to
 * Supabase Auth).  The database trigger `handle_new_user` automatically
 * creates the profiles + athlete_profiles rows.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const validRoles = ["ATHLETE", "PSYCHOLOGIST"];
    const userRole = validRoles.includes(role) ? role : "ATHLETE";

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        data: { name, role: userRole },
      },
    });

    if (error) {
      // Supabase returns specific error messages
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { message: "Account created successfully.", userId: data.user?.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
