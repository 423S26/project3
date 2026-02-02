/**
 * Event category types for the Anchor dashboard
 */
export type EventCategory = "schedule" | "bills" | "workouts" | "meals";

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
  schedule: {
    label: "Schedule",
    color: "hsl(221.2 83.2% 53.3%)",
    bgColor: "bg-blue-500",
    textColor: "text-blue-500",
    icon: "Calendar",
  },
  bills: {
    label: "Bills",
    color: "hsl(0 84.2% 60.2%)",
    bgColor: "bg-red-500",
    textColor: "text-red-500",
    icon: "CreditCard",
  },
  workouts: {
    label: "Workouts",
    color: "hsl(142.1 76.2% 36.3%)",
    bgColor: "bg-green-500",
    textColor: "text-green-500",
    icon: "Dumbbell",
  },
  meals: {
    label: "Meals",
    color: "hsl(32.1 94.6% 43.7%)",
    bgColor: "bg-orange-500",
    textColor: "text-orange-500",
    icon: "Utensils",
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
  "schedule",
  "bills",
  "workouts",
  "meals",
];

/**
 * Default filter state (all categories visible)
 */
export function getDefaultFilters(): Record<EventCategory, boolean> {
  return {
    schedule: true,
    bills: true,
    workouts: true,
    meals: true,
  };
}
