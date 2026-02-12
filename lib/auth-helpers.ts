import { getAuthUser } from "./supabase/server";

/**
 * Get the current authenticated user's profile on the server.
 * Returns null if not authenticated.
 */
export async function getSession() {
  return getAuthUser();
}

/**
 * Get the active athlete ID for data queries.
 * - ATHLETE: returns their own user id
 * - PSYCHOLOGIST: returns the selected athlete id,
 *   or null if none selected
 */
export async function getActiveAthleteId(
  selectedAthleteId?: string | null
): Promise<string | null> {
  const user = await getAuthUser();
  if (!user) return null;

  if (user.role === "ATHLETE") {
    return user.id;
  }

  // Psychologist: use selected athlete or null
  return selectedAthleteId ?? null;
}
