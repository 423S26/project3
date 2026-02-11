/**
 * 1-10 scale with emoji for psychological check-ins.
 * Same mapping for Mood, Stress, Motivation.
 */
export const EMOJI_SCALE: Record<number, string> = {
  1: "😞",
  2: "😟",
  3: "🙁",
  4: "😐",
  5: "😐",
  6: "🙂",
  7: "😊",
  8: "😄",
  9: "🤗",
  10: "🤩",
};

export const SCALE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
