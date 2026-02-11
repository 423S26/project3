import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/checkins?athleteId=...&date=YYYY-MM-DD
 * Returns check-ins for the active athlete, optionally filtered by date.
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date"); // YYYY-MM-DD
  let athleteId: string;

  if (session.user.role === "PSYCHOLOGIST") {
    const requested = searchParams.get("athleteId");
    if (!requested) {
      return NextResponse.json({ error: "athleteId required for psychologist" }, { status: 400 });
    }
    athleteId = requested;
  } else {
    athleteId = session.user.id;
  }

  // Build where clause
  const where: { athleteId: string; createdAt?: { gte: Date; lte: Date } } = {
    athleteId,
  };

  if (dateParam) {
    const [y, m, d] = dateParam.split("-").map(Number);
    where.createdAt = {
      gte: new Date(y, m - 1, d, 0, 0, 0, 0),
      lte: new Date(y, m - 1, d, 23, 59, 59, 999),
    };
  }

  const checkIns = await prisma.checkIn.findMany({
    where,
    orderBy: { createdAt: "asc" },
  });

  // Parse BRUMS JSON fields for the client
  const result = checkIns.map((ci) => ({
    id: ci.id,
    athleteId: ci.athleteId,
    mood: ci.mood,
    stress: ci.stress,
    motivation: ci.motivation,
    notes: ci.notes,
    brums: ci.brumsJson
      ? {
          completed: true,
          items: JSON.parse(ci.brumsJson),
          subscales: ci.brumsSubscalesJson
            ? JSON.parse(ci.brumsSubscalesJson)
            : null,
        }
      : undefined,
    createdAt: ci.createdAt.toISOString(),
  }));

  return NextResponse.json(result);
}

/**
 * POST /api/checkins
 * Create a new check-in for the authenticated athlete (or specified athlete if psychologist).
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { mood, stress, motivation, notes, brums, createdAt, athleteId: bodyAthleteId } = body;

  // Validate required fields
  if (
    typeof mood !== "number" || mood < 1 || mood > 10 ||
    typeof stress !== "number" || stress < 1 || stress > 10 ||
    typeof motivation !== "number" || motivation < 1 || motivation > 10
  ) {
    return NextResponse.json(
      { error: "mood, stress, and motivation must be numbers 1-10" },
      { status: 400 }
    );
  }

  let athleteId: string;
  if (session.user.role === "PSYCHOLOGIST") {
    athleteId = bodyAthleteId ?? session.user.id;
  } else {
    athleteId = session.user.id;
  }

  const checkIn = await prisma.checkIn.create({
    data: {
      athleteId,
      mood,
      stress,
      motivation,
      notes: notes?.trim() || null,
      brumsJson: brums?.items ? JSON.stringify(brums.items) : null,
      brumsSubscalesJson: brums?.subscales
        ? JSON.stringify(brums.subscales)
        : null,
      createdAt: createdAt ? new Date(createdAt) : new Date(),
    },
  });

  return NextResponse.json(
    {
      id: checkIn.id,
      athleteId: checkIn.athleteId,
      mood: checkIn.mood,
      stress: checkIn.stress,
      motivation: checkIn.motivation,
      notes: checkIn.notes,
      brums: brums?.items
        ? { completed: true, items: brums.items, subscales: brums.subscales }
        : undefined,
      createdAt: checkIn.createdAt.toISOString(),
    },
    { status: 201 }
  );
}
