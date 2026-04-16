/**
 * MET-based calorie estimation for sport sessions.
 *
 * Uses a combo rule: base MET from intensity + RPE adjustment.
 *
 * Formula:  calories = MET × 3.5 × weight_kg / 200 × duration_min
 *
 * This is a standard exercise physiology approximation (VO₂-based).
 * It is clearly labeled as an estimate in the UI.
 */

/** Map intensity dropdown → base MET value */
const INTENSITY_MET: Record<string, number> = {
  low: 3.0,
  moderate: 5.0,
  high: 7.0,
  "very high": 9.0,
  competition: 10.0,
};

/**
 * RPE adjustment multiplier band.
 * RPE 5 = neutral (1.0×), each point away adjusts ±5%.
 */
function rpeMultiplier(rpe: number): number {
  const clamped = Math.max(1, Math.min(10, rpe));
  // RPE 5 = 1.0, RPE 10 = 1.25, RPE 1 = 0.80
  return 1 + (clamped - 5) * 0.05;
}

/**
 * Estimate calories burned for a sport session.
 *
 * @returns null if missing required inputs (bodyweight or duration)
 */
export function estimateCaloriesBurned(params: {
  durationMin: number | null | undefined;
  intensity: string | null | undefined;
  rpe: number | null | undefined;
  bodyweightKg: number | null | undefined;
}): number | null {
  const { durationMin, intensity, rpe, bodyweightKg } = params;

  if (!durationMin || durationMin <= 0) return null;
  if (!bodyweightKg || bodyweightKg <= 0) return null;

  // Need at least one of intensity or RPE
  if (!intensity && !rpe) return null;

  // Determine base MET
  let baseMet: number;
  if (intensity && INTENSITY_MET[intensity.toLowerCase()]) {
    baseMet = INTENSITY_MET[intensity.toLowerCase()];
  } else if (rpe) {
    // If no intensity dropdown, derive rough MET from RPE alone
    // RPE 1-3 ≈ low (3), RPE 4-5 ≈ moderate (5), RPE 6-7 ≈ high (7), RPE 8-9 ≈ very high (9), RPE 10 ≈ competition (10)
    if (rpe <= 3) baseMet = 3.0;
    else if (rpe <= 5) baseMet = 5.0;
    else if (rpe <= 7) baseMet = 7.0;
    else if (rpe <= 9) baseMet = 9.0;
    else baseMet = 10.0;
  } else {
    baseMet = 5.0; // default moderate
  }

  // Apply RPE adjustment on top of intensity-based MET
  const adjustedMet = rpe ? baseMet * rpeMultiplier(rpe) : baseMet;

  // calories = MET × 3.5 × weight_kg / 200 × duration_min
  const calories = adjustedMet * 3.5 * bodyweightKg / 200 * durationMin;

  return Math.round(calories);
}
