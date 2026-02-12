/**
 * One-off migration script: SQLite (via Prisma) → Supabase Postgres
 *
 * Prerequisites:
 *   1. Run the SQL migration (supabase/migrations/001_init.sql) in your
 *      Supabase project FIRST so the tables + triggers exist.
 *   2. Set the following env vars (or create a .env file):
 *        NEXT_PUBLIC_SUPABASE_URL
 *        SUPABASE_SERVICE_ROLE_KEY
 *        DATABASE_URL="file:./dev.db"   (points at your SQLite file)
 *   3. Prisma client must still be generated:  npx prisma generate
 *
 * Run with:
 *   npx tsx scripts/migrate-sqlite-to-supabase.ts
 *
 * What it does:
 *   - Reads all Users, AthleteProfiles, and CheckIns from SQLite
 *   - Creates corresponding Supabase Auth users (with a temp password)
 *   - The DB trigger auto-creates profiles + athlete_profiles rows on signup,
 *     so we UPDATE those rows with the original data afterwards
 *   - Inserts CheckIn rows mapped to the new Supabase UUIDs
 *   - Prints an ID mapping and summary
 *
 * After running:
 *   - Tell users to reset their passwords via the Supabase Auth "forgot
 *     password" flow (their old bcrypt hashes cannot be ported).
 */

import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

// ── Config ──────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const TEMP_PASSWORD = "AnchorTempPass!2026"; // users must reset

if (!SUPABASE_URL || SUPABASE_URL.includes("your-project")) {
  console.error("ERROR: Set NEXT_PUBLIC_SUPABASE_URL before running.");
  process.exit(1);
}
if (!SERVICE_ROLE_KEY || SERVICE_ROLE_KEY.includes("your-service")) {
  console.error("ERROR: Set SUPABASE_SERVICE_ROLE_KEY before running.");
  process.exit(1);
}

const prisma = new PrismaClient();
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Helpers ─────────────────────────────────────────────────

/** Map from old SQLite cuid → new Supabase UUID */
const idMap = new Map<string, string>();

async function migrateUsers() {
  const users = await prisma.user.findMany({
    include: { athleteProfile: true },
  });

  console.log(`\nFound ${users.length} users in SQLite.\n`);

  for (const user of users) {
    // Create Supabase Auth user (admin API bypasses email confirmation)
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: TEMP_PASSWORD,
      email_confirm: true, // mark as confirmed
      user_metadata: {
        name: user.name,
        role: user.role,
      },
    });

    if (error) {
      console.error(`  SKIP ${user.email}: ${error.message}`);
      continue;
    }

    const newId = data.user.id;
    idMap.set(user.id, newId);
    console.log(`  Migrated user ${user.email}  ${user.id} → ${newId}`);

    // The trigger already created a profiles row and (for athletes)
    // an athlete_profiles row.  Update them with original timestamps.
    await supabase
      .from("profiles")
      .update({
        created_at: user.createdAt.toISOString(),
        updated_at: user.updatedAt.toISOString(),
      })
      .eq("id", newId);

    // Update athlete profile if exists
    if (user.athleteProfile) {
      await supabase
        .from("athlete_profiles")
        .update({
          sport: user.athleteProfile.sport,
          position: user.athleteProfile.position,
          team: user.athleteProfile.team,
          created_at: user.athleteProfile.createdAt.toISOString(),
          updated_at: user.athleteProfile.updatedAt.toISOString(),
        })
        .eq("user_id", newId);
    }
  }
}

async function migrateCheckIns() {
  const checkIns = await prisma.checkIn.findMany({
    orderBy: { createdAt: "asc" },
  });

  console.log(`\nFound ${checkIns.length} check-ins in SQLite.\n`);

  let migrated = 0;
  let skipped = 0;

  for (const ci of checkIns) {
    const newAthleteId = idMap.get(ci.athleteId);
    if (!newAthleteId) {
      console.error(`  SKIP check-in ${ci.id}: athlete ${ci.athleteId} not migrated`);
      skipped++;
      continue;
    }

    const { error } = await supabase.from("check_ins").insert({
      athlete_id: newAthleteId,
      created_at: ci.createdAt.toISOString(),
      mood: ci.mood,
      stress: ci.stress,
      motivation: ci.motivation,
      notes: ci.notes,
      brums_json: ci.brumsJson ? JSON.parse(ci.brumsJson) : null,
      brums_subscales_json: ci.brumsSubscalesJson
        ? JSON.parse(ci.brumsSubscalesJson)
        : null,
    });

    if (error) {
      console.error(`  SKIP check-in ${ci.id}: ${error.message}`);
      skipped++;
    } else {
      migrated++;
    }
  }

  console.log(`  Migrated: ${migrated}  Skipped: ${skipped}`);
}

// ── Main ────────────────────────────────────────────────────

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  Anchor: SQLite → Supabase migration");
  console.log("═══════════════════════════════════════════");

  await migrateUsers();
  await migrateCheckIns();

  console.log("\n── ID Mapping ──────────────────────────────");
  for (const [oldId, newId] of idMap) {
    console.log(`  ${oldId} → ${newId}`);
  }

  console.log("\n── Done ────────────────────────────────────");
  console.log(`All migrated users have temporary password: ${TEMP_PASSWORD}`);
  console.log("Ask them to use 'Forgot password' to set a new one.\n");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
