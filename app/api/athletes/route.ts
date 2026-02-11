import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/athletes
 * Returns list of athletes. Only accessible by psychologists.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "PSYCHOLOGIST") {
    return NextResponse.json(
      { error: "Only psychologists can list athletes" },
      { status: 403 }
    );
  }

  const athletes = await prisma.user.findMany({
    where: { role: "ATHLETE" },
    select: {
      id: true,
      name: true,
      email: true,
      athleteProfile: {
        select: { sport: true, position: true, team: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(athletes);
}
