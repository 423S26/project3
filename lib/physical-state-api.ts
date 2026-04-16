/**
 * Client-side API functions for Physical State data:
 * recovery, workouts, meals, wearable integrations, and the unified events feed.
 */

import type { AnchorEvent, EventCategory } from "./event-types";

// ── Unified events ──────────────────────────────────────────

export interface AnchorEventDTO {
  id: string;
  title: string;
  category: EventCategory;
  start: string; // ISO
  end: string;   // ISO
  allDay: boolean;
  description: string;
  metadata: Record<string, unknown>;
}

/**
 * Fetch unified events across all categories for a date range.
 */
export async function fetchEvents(
  from: string,
  to: string,
  athleteId?: string
): Promise<AnchorEvent[]> {
  const params = new URLSearchParams({ from, to });
  if (athleteId) params.set("athleteId", athleteId);
  const res = await fetch(`/api/events?${params.toString()}`);
  if (!res.ok) return [];
  const dtos: AnchorEventDTO[] = await res.json();
  return dtos.map((d) => ({
    ...d,
    start: new Date(d.start),
    end: d.end ? new Date(d.end) : undefined,
  }));
}

// ── Recovery ────────────────────────────────────────────────

export interface RecoveryEntry {
  id: string;
  athlete_id: string;
  date: string;
  source: string;
  sleep_start: string | null;
  sleep_end: string | null;
  sleep_minutes: number | null;
  sleep_score: number | null;
  resting_hr: number | null;
  hrv_ms: number | null;
  notes: string | null;
  created_at: string;
}

export async function fetchRecovery(
  from?: string,
  to?: string,
  athleteId?: string
): Promise<RecoveryEntry[]> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (athleteId) params.set("athleteId", athleteId);
  const res = await fetch(`/api/recovery?${params.toString()}`);
  if (!res.ok) return [];
  return res.json();
}

export async function createRecoveryEntry(data: {
  date: string;
  sleepStart?: string;
  sleepEnd?: string;
  sleepMinutes?: number;
  sleepScore?: number;
  restingHr?: number;
  hrvMs?: number;
  notes?: string;
}): Promise<RecoveryEntry> {
  const res = await fetch("/api/recovery", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to save recovery");
  }
  return res.json();
}

// ── Workouts ────────────────────────────────────────────────

export interface WorkoutSession {
  id: string;
  athlete_id: string;
  template_id: string | null;
  type: "strength" | "sport_session";
  name: string;
  sport: string | null;
  started_at: string;
  ended_at: string | null;
  duration_min: number | null;
  rpe: number | null;
  intensity: string | null;
  notes: string | null;
  workout_session_exercises?: WorkoutSessionExercise[];
}

export interface WorkoutSessionExercise {
  id: string;
  exercise_name: string;
  sort_order: number;
  workout_sets?: WorkoutSet[];
}

export interface WorkoutSet {
  id: string;
  set_number: number;
  reps: number | null;
  weight_kg: number | null;
  duration_sec: number | null;
  notes: string | null;
}

export interface WorkoutTemplate {
  id: string;
  athlete_id: string;
  name: string;
  sport: string | null;
  type: string;
  workout_template_exercises?: {
    id: string;
    exercise_name: string;
    default_sets: number | null;
    default_reps: number | null;
    default_weight_kg: number | null;
    sort_order: number;
  }[];
}

export async function fetchWorkoutSessions(
  from?: string,
  to?: string,
  athleteId?: string
): Promise<WorkoutSession[]> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (athleteId) params.set("athleteId", athleteId);
  const res = await fetch(`/api/workouts/sessions?${params.toString()}`);
  if (!res.ok) return [];
  return res.json();
}

export async function createWorkoutSession(data: {
  name: string;
  type?: "strength" | "sport_session";
  sport?: string;
  templateId?: string;
  startedAt?: string;
  endedAt?: string;
  durationMin?: number;
  rpe?: number;
  intensity?: string;
  notes?: string;
  exercises?: {
    exerciseName: string;
    sets?: { setNumber: number; reps?: number; weightKg?: number; durationSec?: number }[];
  }[];
}): Promise<WorkoutSession> {
  const res = await fetch("/api/workouts/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to save workout");
  }
  return res.json();
}

export async function fetchWorkoutTemplates(
  athleteId?: string
): Promise<WorkoutTemplate[]> {
  const params = new URLSearchParams();
  if (athleteId) params.set("athleteId", athleteId);
  const res = await fetch(`/api/workouts/templates?${params.toString()}`);
  if (!res.ok) return [];
  return res.json();
}

export async function createWorkoutTemplate(data: {
  name: string;
  sport?: string;
  type?: string;
  exercises?: {
    exerciseName: string;
    defaultSets?: number;
    defaultReps?: number;
    defaultWeightKg?: number;
    exerciseLibraryId?: string;
  }[];
}): Promise<WorkoutTemplate> {
  const res = await fetch("/api/workouts/templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to save template");
  }
  return res.json();
}

export async function deleteWorkoutTemplate(templateId: string): Promise<void> {
  const res = await fetch(`/api/workouts/templates/${templateId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to delete template");
  }
}

// ── Meals ───────────────────────────────────────────────────

export interface MealLog {
  id: string;
  athlete_id: string;
  logged_at: string;
  meal_type: string | null;
  meal_name: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  notes: string | null;
}

export async function fetchMeals(
  from?: string,
  to?: string,
  athleteId?: string
): Promise<MealLog[]> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (athleteId) params.set("athleteId", athleteId);
  const res = await fetch(`/api/meals?${params.toString()}`);
  if (!res.ok) return [];
  return res.json();
}

export async function createMeal(data: {
  mealName: string;
  mealType?: string;
  loggedAt?: string;
  calories?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  fiberG?: number;
  edamamFoodJson?: unknown;
  notes?: string;
}): Promise<MealLog> {
  const res = await fetch("/api/meals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to save meal");
  }
  return res.json();
}

// ── Edamam Food Search ──────────────────────────────────────

export interface EdamamFood {
  foodId: string;
  label: string;
  image: string | null;
  brand: string | null;
  category: string | null;
  nutrients: {
    calories: number | null;
    protein: number | null;
    carbs: number | null;
    fat: number | null;
    fiber: number | null;
  };
}

export async function searchEdamamFoods(query: string): Promise<EdamamFood[]> {
  const params = new URLSearchParams({ q: query });
  const res = await fetch(`/api/edamam/search?${params.toString()}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.foods ?? [];
}

// ── Exercise Library (wger) ──────────────────────────────────

export interface ExerciseSearchResult {
  providerExerciseId: string;
  name: string;
  category: string | null;
  muscles: string[];
  equipment: string[];
  description: string | null;
}

export interface SavedExercise {
  id: string;
  provider: string;
  provider_exercise_id: string;
  name: string;
  category: string | null;
  muscles: string[];
  equipment: string[];
  description: string | null;
}

export async function searchExercises(query: string): Promise<ExerciseSearchResult[]> {
  const params = new URLSearchParams({ q: query });
  const res = await fetch(`/api/exercises/search?${params.toString()}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.exercises ?? [];
}

export async function saveExercise(exercise: ExerciseSearchResult): Promise<SavedExercise> {
  const res = await fetch("/api/exercises/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(exercise),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to save exercise");
  }
  return res.json();
}

// ── Energy ──────────────────────────────────────────────────

export interface DayEnergy {
  date: string;
  calories_in: number;
  protein_in: number;
  carbs_in: number;
  fat_in: number;
  calories_out_wearable: number | null;
  calories_out_est: number;
  calories_out_total: number;
  net: number;
  quality: string;
}

export interface EnergyResponse {
  days: DayEnergy[];
  hasBodyweight: boolean;
  bodyweightKg: number | null;
}

export async function fetchEnergy(
  from: string,
  to: string,
  athleteId?: string
): Promise<EnergyResponse> {
  const params = new URLSearchParams({ from, to });
  if (athleteId) params.set("athleteId", athleteId);
  const res = await fetch(`/api/energy?${params.toString()}`);
  if (!res.ok) return { days: [], hasBodyweight: false, bodyweightKg: null };
  return res.json();
}

// ── Athlete Profile ─────────────────────────────────────────

export interface AthleteProfile {
  user_id: string;
  sport: string | null;
  position: string | null;
  team: string | null;
  bodyweight_kg: number | null;
}

export async function fetchAthleteProfile(): Promise<AthleteProfile | null> {
  const res = await fetch("/api/athlete-profile");
  if (!res.ok) return null;
  return res.json();
}

export async function updateAthleteProfile(data: {
  sport?: string;
  position?: string;
  team?: string;
  bodyweightKg?: number | null;
}): Promise<AthleteProfile> {
  const res = await fetch("/api/athlete-profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to update profile");
  }
  return res.json();
}

// ── Integration status ──────────────────────────────────────

export async function syncFitbit(): Promise<{ synced: string[]; count: number }> {
  const res = await fetch("/api/integrations/fitbit/sync", { method: "POST" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Fitbit sync failed");
  }
  return res.json();
}

export async function syncOura(): Promise<{ synced: string[]; count: number }> {
  const res = await fetch("/api/integrations/oura/sync", { method: "POST" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Oura sync failed");
  }
  return res.json();
}
