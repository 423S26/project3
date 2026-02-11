/**
 * Client-side API functions for check-in data.
 * All functions are async and hit /api/checkins endpoints.
 */

import type { PsychCheckIn, BrumsData } from "./psych-checkins";

interface CreateCheckInData {
  mood: number;
  stress: number;
  motivation: number;
  notes?: string;
  brums?: BrumsData;
  createdAt?: string;
  athleteId?: string;
}

/**
 * Fetch all check-ins for the active athlete.
 * Psychologists must pass athleteId.
 */
export async function fetchCheckIns(
  athleteId?: string
): Promise<PsychCheckIn[]> {
  const params = new URLSearchParams();
  if (athleteId) params.set("athleteId", athleteId);
  const res = await fetch(`/api/checkins?${params.toString()}`);
  if (!res.ok) return [];
  return res.json();
}

/**
 * Fetch check-ins for a specific date (YYYY-MM-DD).
 */
export async function fetchCheckInsForDate(
  dateKey: string,
  athleteId?: string
): Promise<PsychCheckIn[]> {
  const params = new URLSearchParams({ date: dateKey });
  if (athleteId) params.set("athleteId", athleteId);
  const res = await fetch(`/api/checkins?${params.toString()}`);
  if (!res.ok) return [];
  return res.json();
}

/**
 * Get the most recent check-in for the active athlete.
 */
export async function fetchLatestCheckIn(
  athleteId?: string
): Promise<PsychCheckIn | null> {
  const all = await fetchCheckIns(athleteId);
  if (all.length === 0) return null;
  // Sort newest first
  const sorted = [...all].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return sorted[0];
}

/**
 * Create a new check-in via the API.
 */
export async function createCheckIn(
  data: CreateCheckInData
): Promise<PsychCheckIn> {
  const res = await fetch("/api/checkins", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to save check-in");
  }
  return res.json();
}

/**
 * Import check-ins from localStorage to the database.
 */
export async function importLocalCheckIns(
  checkIns: PsychCheckIn[]
): Promise<{ imported: number; total: number }> {
  const res = await fetch("/api/checkins/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ checkIns }),
  });
  if (!res.ok) throw new Error("Import failed");
  return res.json();
}
