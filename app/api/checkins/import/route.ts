import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * POST /api/checkins/import
 * Bulk-import check-ins from localStorage for the authenticated athlete.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ATHLETE") {
    return NextResponse.json(
      { error: "Only athletes can import check-ins" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { checkIns } = body;

  if (!Array.isArray(checkIns) || checkIns.length === 0) {
    return NextResponse.json(
      { error: "checkIns array is required" },
      { status: 400 }
    );
  }

  let imported = 0;
  for (const ci of checkIns) {
    try {
      await prisma.checkIn.create({
        data: {
          athleteId: session.user.id,
          mood: Math.min(10, Math.max(1, ci.mood ?? 5)),
          stress: Math.min(10, Math.max(1, ci.stress ?? 5)),
          motivation: Math.min(10, Math.max(1, ci.motivation ?? 5)),
          notes: ci.notes?.trim() || null,
          brumsJson: ci.brums?.items ? JSON.stringify(ci.brums.items) : null,
          brumsSubscalesJson: ci.brums?.subscales
            ? JSON.stringify(ci.brums.subscales)
            : null,
          createdAt: ci.createdAt ? new Date(ci.createdAt) : new Date(),
        },
      });
      imported++;
    } catch {
      // Skip individual failures (e.g. duplicates)
    }
  }

  return NextResponse.json({ imported, total: checkIns.length });
}
