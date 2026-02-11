import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

/**
 * Get the current session on the server.
 * Returns null if not authenticated.
 */
export async function getSession() {
  return getServerSession(authOptions);
}

/**
 * Get the active athlete ID for data queries.
 * - ATHLETE: returns their own user id
 * - PSYCHOLOGIST: returns the selected athlete id from cookie/header,
 *   or null if none selected
 */
export async function getActiveAthleteId(
  selectedAthleteId?: string | null
): Promise<string | null> {
  const session = await getSession();
  if (!session?.user) return null;

  if (session.user.role === "ATHLETE") {
    return session.user.id;
  }

  // Psychologist: use selected athlete or null
  return selectedAthleteId ?? null;
}
