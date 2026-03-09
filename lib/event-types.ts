/**
 * Event category types for the Anchor sports psychology dashboard
 */
export type EventCategory = "training" | "recovery" | "mood" | "fueling" | "assessments" | "sessions";

/**
 * Unified event type used across the calendar and dashboard
 */
export interface AnchorEvent {
  id: string;
  title: string;
  category: EventCategory;
  start: Date;
  end?: Date;
  allDay?: boolean;
  description?: string;
  /** Optional metadata for category-specific data */
  metadata?: Record<string, unknown>;
}

/**
 * Category display configuration
 */
export interface CategoryConfig {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  icon: string;
}

/**
 * Category configuration mapping
 */
export const CATEGORY_CONFIG: Record<EventCategory, CategoryConfig> = {
  training: {
    label: "Training",
    color: "hsl(221.2 83.2% 53.3%)",
    bgColor: "bg-blue-500",
    textColor: "text-blue-500",
    icon: "Dumbbell",
  },
  recovery: {
    label: "Recovery",
    color: "hsl(142.1 76.2% 36.3%)",
    bgColor: "bg-green-500",
    textColor: "text-green-500",
    icon: "Battery",
  },
  mood: {
    label: "Mood",
    color: "hsl(270 70% 60%)",
    bgColor: "bg-violet-500",
    textColor: "text-violet-500",
    icon: "Smile",
  },
  fueling: {
    label: "Fueling",
    color: "hsl(32.1 94.6% 43.7%)",
    bgColor: "bg-orange-500",
    textColor: "text-orange-500",
    icon: "Utensils",
  },
  assessments: {
    label: "Assessments",
    color: "hsl(180 60% 40%)",
    bgColor: "bg-teal-500",
    textColor: "text-teal-500",
    icon: "ClipboardList",
  },
  sessions: {
    label: "Sessions",
    color: "hsl(340 75% 55%)",
    bgColor: "bg-pink-500",
    textColor: "text-pink-500",
    icon: "Video",
  },
};

/**
 * Get the CSS class for an event category
 */
export function getCategoryClassName(category: EventCategory): string {
  return `event-${category}`;
}

/**
 * All event categories for filter iteration
 */
export const ALL_CATEGORIES: EventCategory[] = [
  "training",
  "recovery",
  "mood",
  "fueling",
  "assessments",
  "sessions",
];

/**
 * Default filter state (all categories visible)
 */
export function getDefaultFilters(): Record<EventCategory, boolean> {
  return {
    training: true,
    recovery: true,
    mood: true,
    fueling: true,
    assessments: true,
    sessions: true,
  };
}
