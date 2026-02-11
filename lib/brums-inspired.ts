/**
 * BRUMS-Inspired Mood Profile
 *
 * 24 items across 6 subscales, rated 0–4.
 * Wording is original / paraphrased (NOT the copyrighted BRUMS items).
 *
 * Subscales (4 items each, score range 0–16):
 *   Tension, Depression, Anger, Vigor, Fatigue, Confusion
 */

export type BrumsSubscale =
  | "tension"
  | "depression"
  | "anger"
  | "vigor"
  | "fatigue"
  | "confusion";

export const BRUMS_SUBSCALES: BrumsSubscale[] = [
  "tension",
  "depression",
  "anger",
  "vigor",
  "fatigue",
  "confusion",
];

export const SUBSCALE_LABELS: Record<BrumsSubscale, string> = {
  tension: "Tension",
  depression: "Depression",
  anger: "Anger",
  vigor: "Vigor",
  fatigue: "Fatigue",
  confusion: "Confusion",
};

/** 0–4 response anchors */
export const RESPONSE_LABELS = [
  "Not at all",
  "A little",
  "Moderately",
  "Quite a lot",
  "Extremely",
] as const;

export type ResponseValue = 0 | 1 | 2 | 3 | 4;

export interface BrumsItem {
  id: number;
  label: string;
  subscale: BrumsSubscale;
}

/**
 * 24 items — our own wording, grouped by subscale in definition
 * but presented in mixed order (use ITEM_PRESENTATION_ORDER).
 */
export const BRUMS_ITEMS: BrumsItem[] = [
  // Tension (4)
  { id: 1, label: "On edge", subscale: "tension" },
  { id: 2, label: "Uneasy", subscale: "tension" },
  { id: 3, label: "Restless", subscale: "tension" },
  { id: 4, label: "Tense", subscale: "tension" },

  // Depression (4)
  { id: 5, label: "Low", subscale: "depression" },
  { id: 6, label: "Discouraged", subscale: "depression" },
  { id: 7, label: "Hopeless", subscale: "depression" },
  { id: 8, label: "Sad", subscale: "depression" },

  // Anger (4)
  { id: 9, label: "Irritated", subscale: "anger" },
  { id: 10, label: "Frustrated", subscale: "anger" },
  { id: 11, label: "Resentful", subscale: "anger" },
  { id: 12, label: "Short-tempered", subscale: "anger" },

  // Vigor (4)
  { id: 13, label: "Full of energy", subscale: "vigor" },
  { id: 14, label: "Lively", subscale: "vigor" },
  { id: 15, label: "Motivated", subscale: "vigor" },
  { id: 16, label: "Ready to go", subscale: "vigor" },

  // Fatigue (4)
  { id: 17, label: "Worn out", subscale: "fatigue" },
  { id: 18, label: "Drained", subscale: "fatigue" },
  { id: 19, label: "Exhausted", subscale: "fatigue" },
  { id: 20, label: "Sleepy", subscale: "fatigue" },

  // Confusion (4)
  { id: 21, label: "Mixed up", subscale: "confusion" },
  { id: 22, label: "Uncertain", subscale: "confusion" },
  { id: 23, label: "Unable to focus", subscale: "confusion" },
  { id: 24, label: "Scatterbrained", subscale: "confusion" },
];

/**
 * Presentation order — items mixed across subscales so the user
 * doesn't see all four items of a subscale in a row.
 */
export const ITEM_PRESENTATION_ORDER: number[] = [
  1, 13, 5, 17, 9, 21,   // round 1: one from each subscale
  2, 14, 6, 18, 10, 22,  // round 2
  3, 15, 7, 19, 11, 23,  // round 3
  4, 16, 8, 20, 12, 24,  // round 4
];

/** Look up an item by id */
export function getItemById(id: number): BrumsItem | undefined {
  return BRUMS_ITEMS.find((i) => i.id === id);
}

/** Stored responses: mapping from item id → 0-4 */
export type BrumsResponses = Record<number, ResponseValue>;

export interface BrumsSubscaleScores {
  tension: number;
  depression: number;
  anger: number;
  vigor: number;
  fatigue: number;
  confusion: number;
}

/**
 * Compute subscale totals from a full set of responses.
 * Each subscale has 4 items, so range is 0–16.
 * Returns null values for any subscale with missing items.
 */
export function computeSubscales(
  responses: BrumsResponses
): BrumsSubscaleScores {
  const scores: BrumsSubscaleScores = {
    tension: 0,
    depression: 0,
    anger: 0,
    vigor: 0,
    fatigue: 0,
    confusion: 0,
  };

  for (const item of BRUMS_ITEMS) {
    const val = responses[item.id];
    if (val != null) {
      scores[item.subscale] += val;
    }
  }

  return scores;
}

/**
 * Check whether all 24 items have been answered.
 */
export function isComplete(responses: BrumsResponses): boolean {
  return BRUMS_ITEMS.every((item) => responses[item.id] != null);
}

/**
 * Format subscale scores into a concise string for calendar events.
 */
export function formatSubscaleSummary(scores: BrumsSubscaleScores): string {
  return [
    `Vigor=${scores.vigor}`,
    `Tension=${scores.tension}`,
    `Fatigue=${scores.fatigue}`,
    `Depression=${scores.depression}`,
    `Anger=${scores.anger}`,
    `Confusion=${scores.confusion}`,
  ].join(" · ");
}
