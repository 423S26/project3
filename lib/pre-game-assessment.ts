export interface AssessmentQuestion {
  id: string;
  text: string;
  min: number;
  max: number;
  minLabel: string;
  maxLabel: string;
}

export const PRE_GAME_QUESTIONS: AssessmentQuestion[] = [
  {
    id: "confidence",
    text: "How confident are you feeling about your upcoming performance?",
    min: 1,
    max: 10,
    minLabel: "Not confident",
    maxLabel: "Extremely confident",
  },
  {
    id: "focus",
    text: "How focused and mentally prepared do you feel right now?",
    min: 1,
    max: 10,
    minLabel: "Very distracted",
    maxLabel: "Fully focused",
  },
  {
    id: "energy",
    text: "How would you rate your physical energy level?",
    min: 1,
    max: 10,
    minLabel: "Very low energy",
    maxLabel: "Very high energy",
  },
  {
    id: "anxiety",
    text: "How anxious or nervous are you feeling?",
    min: 1,
    max: 10,
    minLabel: "Not anxious at all",
    maxLabel: "Extremely anxious",
  },
  {
    id: "sleep_quality",
    text: "How well did you sleep last night?",
    min: 1,
    max: 10,
    minLabel: "Very poorly",
    maxLabel: "Excellent",
  },
  {
    id: "body_readiness",
    text: "How ready does your body feel physically (soreness, injury, fatigue)?",
    min: 1,
    max: 10,
    minLabel: "Not ready at all",
    maxLabel: "Fully recovered and ready",
  },
];

export interface PreGameAnswers {
  [questionId: string]: number;
}

/**
 * Compute an overall readiness score (0–100) from pre-game answers.
 * Anxiety is reverse-scored (lower anxiety = higher readiness).
 */
export function computePreGameScore(answers: PreGameAnswers): number {
  const ids = PRE_GAME_QUESTIONS.map((q) => q.id);
  let total = 0;
  let count = 0;

  for (const id of ids) {
    const val = answers[id];
    if (typeof val !== "number") continue;
    const score = id === "anxiety" ? 11 - val : val;
    total += score;
    count++;
  }

  if (count === 0) return 0;
  return Math.round((total / (count * 10)) * 100);
}

export function isPreGameComplete(answers: PreGameAnswers): boolean {
  return PRE_GAME_QUESTIONS.every(
    (q) => typeof answers[q.id] === "number" && answers[q.id] >= q.min && answers[q.id] <= q.max
  );
}

export function scoreLabel(score: number): string {
  if (score >= 80) return "High Readiness";
  if (score >= 60) return "Moderate Readiness";
  if (score >= 40) return "Low Readiness";
  return "Very Low Readiness";
}

export function scoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-amber-600";
  if (score >= 40) return "text-orange-600";
  return "text-red-600";
}
