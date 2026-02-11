/**
 * Psychological check-in data and localStorage persistence.
 * Client-safe: guard for typeof window before using localStorage.
 */

import {
  type BrumsResponses,
  type BrumsSubscaleScores,
  formatSubscaleSummary,
} from "./brums-inspired";

const STORAGE_KEY = "anchor-psych-checkins";

/* ─── Date-key helpers (timezone-aware) ─── */

/**
 * Convert a Date to a local YYYY-MM-DD string using the user's timezone.
 */
export function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Build a Date from a YYYY-MM-DD key + a specific hour/minute in local time.
 * Useful for saving a check-in on a user-selected date with the current time-of-day.
 */
export function fromLocalDateKey(
  dateKey: string,
  time: { h: number; m: number; s?: number }
): Date {
  const [y, mo, d] = dateKey.split("-").map(Number);
  return new Date(y, mo - 1, d, time.h, time.m, time.s ?? 0);
}

/**
 * Get today's local date key.
 */
export function todayDateKey(): string {
  return toLocalDateKey(new Date());
}

/** Optional BRUMS-inspired expanded mood profile attached to a check-in */
export interface BrumsData {
  completed: boolean;
  items: BrumsResponses;
  subscales: BrumsSubscaleScores;
}

export interface PsychCheckIn {
  id: string;
  mood: number; // 1-10
  stress: number; // 1-10
  motivation: number; // 1-10
  notes?: string;
  brums?: BrumsData;
  createdAt: string; // ISO string
}

function isClient(): boolean {
  return typeof window !== "undefined";
}

function loadCheckIns(): PsychCheckIn[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PsychCheckIn[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCheckIns(checkIns: PsychCheckIn[]): void {
  if (!isClient()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checkIns));
  } catch {
    // ignore quota or other errors
  }
}

/**
 * List all stored check-ins (newest first).
 */
export function listCheckIns(): PsychCheckIn[] {
  const all = loadCheckIns();
  return [...all].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Save a new check-in. Generates id and createdAt if not provided.
 */
export function saveCheckIn(
  data: Omit<PsychCheckIn, "id" | "createdAt"> & { id?: string; createdAt?: string }
): PsychCheckIn {
  const checkIn: PsychCheckIn = {
    id: data.id ?? `checkin-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    mood: Math.min(10, Math.max(1, data.mood)),
    stress: Math.min(10, Math.max(1, data.stress)),
    motivation: Math.min(10, Math.max(1, data.motivation)),
    notes: data.notes?.trim() || undefined,
    brums: data.brums,
    createdAt: data.createdAt ?? new Date().toISOString(),
  };
  const all = loadCheckIns();
  all.push(checkIn);
  saveCheckIns(all);
  return checkIn;
}

/**
 * Get the single most recent check-in by createdAt.
 */
export function getLatestCheckIn(): PsychCheckIn | null {
  const all = listCheckIns();
  return all.length > 0 ? all[0] : null;
}

/**
 * Get a specific check-in by id.
 */
export function getCheckInById(id: string): PsychCheckIn | null {
  return loadCheckIns().find((c) => c.id === id) ?? null;
}

/**
 * List all check-ins whose createdAt falls on the given local date key (YYYY-MM-DD).
 * Sorted oldest-first so the timeline reads chronologically.
 */
export function listCheckInsForDateKey(dateKey: string): PsychCheckIn[] {
  const [y, mo, d] = dateKey.split("-").map(Number);
  const start = new Date(y, mo - 1, d, 0, 0, 0, 0);
  const end = new Date(y, mo - 1, d, 23, 59, 59, 999);
  return loadCheckIns()
    .filter((c) => {
      const t = new Date(c.createdAt).getTime();
      return t >= start.getTime() && t <= end.getTime();
    })
    .sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
}

/**
 * Build the description string for a check-in (used by calendar events).
 */
function buildDescription(checkIn: PsychCheckIn): string {
  const quick = `Mood ${checkIn.mood} · Stress ${checkIn.stress} · Motivation ${checkIn.motivation}`;
  const parts: string[] = [quick];
  if (checkIn.brums?.completed) {
    parts.push(formatSubscaleSummary(checkIn.brums.subscales));
  }
  if (checkIn.notes) {
    parts.push(`Notes: ${checkIn.notes}`);
  }
  return parts.join(". ");
}

/**
 * Convert a PsychCheckIn to a FullCalendar-compatible event (category: mood).
 */
export function toCheckInCalendarEvent(checkIn: PsychCheckIn): {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  classNames: string[];
  extendedProps: { category: "mood"; description?: string; metadata?: Record<string, unknown> };
} {
  const start = new Date(checkIn.createdAt);
  const end = new Date(start.getTime() + 15 * 60 * 1000); // 15 min block

  return {
    id: checkIn.id,
    title: checkIn.brums?.completed ? "Mood Profile" : "Check-In",
    start,
    end,
    allDay: false,
    classNames: ["event-mood"],
    extendedProps: {
      category: "mood",
      description: buildDescription(checkIn),
      metadata: {
        checkInId: checkIn.id,
        dateKey: toLocalDateKey(start),
        createdAt: checkIn.createdAt,
        mood: checkIn.mood,
        stress: checkIn.stress,
        motivation: checkIn.motivation,
        notes: checkIn.notes,
        brums: checkIn.brums,
      },
    },
  };
}

/**
 * Get all check-ins as FullCalendar events (for merging with mock events).
 */
export function getCheckInCalendarEvents(): ReturnType<typeof toCheckInCalendarEvent>[] {
  return listCheckIns().map(toCheckInCalendarEvent);
}

/**
 * Get check-ins that fall on a given date as AnchorEvent (for Today panel merge).
 */
export function getCheckInAnchorEventsForDate(date: Date): Array<{
  id: string;
  title: string;
  category: "mood";
  start: Date;
  end?: Date;
  allDay?: boolean;
  description?: string;
  metadata?: Record<string, unknown>;
}> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return listCheckIns()
    .filter((c) => {
      const t = new Date(c.createdAt).getTime();
      return t >= startOfDay.getTime() && t <= endOfDay.getTime();
    })
    .map((c) => {
      const start = new Date(c.createdAt);
      const end = new Date(start.getTime() + 15 * 60 * 1000);
      return {
        id: c.id,
        title: c.brums?.completed ? "Mood Profile" : "Check-In",
        category: "mood" as const,
        start,
        end,
        allDay: false,
        description: buildDescription(c),
        metadata: { mood: c.mood, stress: c.stress, motivation: c.motivation, brums: c.brums },
      };
    });
}
