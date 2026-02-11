import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create psychologist
  const psychHash = await bcrypt.hash("password123", 10);
  const psychologist = await prisma.user.upsert({
    where: { email: "dr.smith@anchor.dev" },
    update: {},
    create: {
      email: "dr.smith@anchor.dev",
      name: "Dr. Smith",
      passwordHash: psychHash,
      role: "PSYCHOLOGIST",
    },
  });
  console.log(`  Psychologist: ${psychologist.email} (id: ${psychologist.id})`);

  // Create athlete A
  const athleteHashA = await bcrypt.hash("password123", 10);
  const athleteA = await prisma.user.upsert({
    where: { email: "athlete.a@anchor.dev" },
    update: {},
    create: {
      email: "athlete.a@anchor.dev",
      name: "Alex Johnson",
      passwordHash: athleteHashA,
      role: "ATHLETE",
      athleteProfile: {
        create: { sport: "Track & Field", position: "Sprinter" },
      },
    },
  });
  console.log(`  Athlete A: ${athleteA.email} (id: ${athleteA.id})`);

  // Create athlete B
  const athleteHashB = await bcrypt.hash("password123", 10);
  const athleteB = await prisma.user.upsert({
    where: { email: "athlete.b@anchor.dev" },
    update: {},
    create: {
      email: "athlete.b@anchor.dev",
      name: "Jordan Rivera",
      passwordHash: athleteHashB,
      role: "ATHLETE",
      athleteProfile: {
        create: { sport: "Swimming", position: "Freestyle" },
      },
    },
  });
  console.log(`  Athlete B: ${athleteB.email} (id: ${athleteB.id})`);

  console.log("\nSeed complete! Demo accounts:");
  console.log("  Psychologist: dr.smith@anchor.dev / password123");
  console.log("  Athlete A:    athlete.a@anchor.dev / password123");
  console.log("  Athlete B:    athlete.b@anchor.dev / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
