import { AnchorEvent, EventCategory } from "./event-types";

/**
 * Helper to create a date relative to today
 */
function relativeDate(daysOffset: number, hour = 9, minute = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  date.setHours(hour, minute, 0, 0);
  return date;
}

/**
 * Mock events covering all categories for Sprint 1 demo
 * Sports psychology themed: training, recovery, mood, fueling, assessments
 */
export const MOCK_EVENTS: AnchorEvent[] = [
  // Today's events
  {
    id: "mood-1",
    title: "Morning Check-In",
    category: "mood",
    start: relativeDate(0, 7, 0),
    end: relativeDate(0, 7, 15),
    description: "Daily mood and motivation check-in",
  },
  {
    id: "training-1",
    title: "Strength Training",
    category: "training",
    start: relativeDate(0, 9, 0),
    end: relativeDate(0, 10, 30),
    description: "Upper body strength session",
    metadata: { intensity: "high", rpe: 8 },
  },
  {
    id: "fueling-1",
    title: "Post-Workout Meal",
    category: "fueling",
    start: relativeDate(0, 11, 0),
    end: relativeDate(0, 11, 30),
    description: "Recovery nutrition - protein and carbs",
  },

  // Tomorrow
  {
    id: "recovery-1",
    title: "Active Recovery",
    category: "recovery",
    start: relativeDate(1, 8, 0),
    end: relativeDate(1, 9, 0),
    description: "Light stretching and mobility work",
    metadata: { type: "active", duration: 60 },
  },
  {
    id: "mood-2",
    title: "Evening Reflection",
    category: "mood",
    start: relativeDate(1, 20, 0),
    end: relativeDate(1, 20, 15),
    description: "End of day stress and motivation check",
  },

  // This week
  {
    id: "training-2",
    title: "Sprint Intervals",
    category: "training",
    start: relativeDate(2, 6, 30),
    end: relativeDate(2, 7, 30),
    description: "High intensity interval training",
    metadata: { intensity: "very high", rpe: 9 },
  },
  {
    id: "assessments-1",
    title: "Weekly Wellbeing Check",
    category: "assessments",
    start: relativeDate(2),
    allDay: true,
    description: "Complete weekly wellbeing assessment",
  },
  {
    id: "recovery-2",
    title: "Sleep Recovery Block",
    category: "recovery",
    start: relativeDate(2, 21, 0),
    end: relativeDate(3, 6, 0),
    description: "Prioritize 9 hours sleep for adaptation",
    metadata: { targetHours: 9 },
  },

  // Mid-week
  {
    id: "training-3",
    title: "Technical Skills Session",
    category: "training",
    start: relativeDate(3, 15, 0),
    end: relativeDate(3, 17, 0),
    description: "Sport-specific technique work",
    metadata: { intensity: "moderate", rpe: 6 },
  },
  {
    id: "fueling-2",
    title: "Pre-Competition Nutrition",
    category: "fueling",
    start: relativeDate(3, 12, 0),
    end: relativeDate(3, 12, 45),
    description: "Carb loading strategy review",
  },
  {
    id: "mood-3",
    title: "Practitioner Session Prep",
    category: "mood",
    start: relativeDate(3, 9, 0),
    end: relativeDate(3, 9, 30),
    description: "Pre-session psychological state check",
  },

  // End of week
  {
    id: "assessments-2",
    title: "Readiness Score Due",
    category: "assessments",
    start: relativeDate(4),
    allDay: true,
    description: "Pre-competition readiness assessment",
  },
  {
    id: "training-4",
    title: "Competition Prep",
    category: "training",
    start: relativeDate(4, 10, 0),
    end: relativeDate(4, 12, 0),
    description: "Light technical prep before competition",
    metadata: { intensity: "low", rpe: 4 },
  },
  {
    id: "recovery-3",
    title: "Massage Therapy",
    category: "recovery",
    start: relativeDate(4, 14, 0),
    end: relativeDate(4, 15, 0),
    description: "Sports massage for muscle recovery",
    metadata: { type: "passive" },
  },

  // Next week
  {
    id: "training-5",
    title: "Competition Day",
    category: "training",
    start: relativeDate(5, 9, 0),
    end: relativeDate(5, 17, 0),
    description: "Main event - peak performance day",
    metadata: { intensity: "competition", rpe: 10 },
  },
  {
    id: "fueling-3",
    title: "Competition Day Nutrition",
    category: "fueling",
    start: relativeDate(5, 7, 0),
    end: relativeDate(5, 7, 30),
    description: "Pre-competition meal - familiar foods",
  },
  {
    id: "recovery-4",
    title: "Post-Competition Recovery",
    category: "recovery",
    start: relativeDate(6, 8, 0),
    end: relativeDate(6, 12, 0),
    description: "Full recovery protocol after competition",
    metadata: { type: "full", duration: 240 },
  },
  {
    id: "mood-4",
    title: "Competition Debrief",
    category: "mood",
    start: relativeDate(6, 14, 0),
    end: relativeDate(6, 15, 0),
    description: "Psychological reflection on performance",
  },
  {
    id: "assessments-3",
    title: "Monthly Progress Review",
    category: "assessments",
    start: relativeDate(7),
    allDay: true,
    description: "Comprehensive monthly wellbeing assessment",
  },

  // More variety
  {
    id: "training-6",
    title: "Endurance Session",
    category: "training",
    start: relativeDate(8, 6, 0),
    end: relativeDate(8, 8, 0),
    description: "Long steady-state cardio",
    metadata: { intensity: "moderate", rpe: 5 },
  },
  {
    id: "fueling-4",
    title: "Hydration Check",
    category: "fueling",
    start: relativeDate(8, 10, 0),
    end: relativeDate(8, 10, 15),
    description: "Monitor hydration status",
  },
];

/**
 * Get events for a specific date
 */
export function getEventsForDate(date: Date): AnchorEvent[] {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  return MOCK_EVENTS.filter((event) => {
    const eventDate = new Date(event.start);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate.getTime() === targetDate.getTime();
  });
}

/**
 * Get today's events
 */
export function getTodaysEvents(): AnchorEvent[] {
  return getEventsForDate(new Date());
}

/**
 * Get events filtered by categories
 */
export function getFilteredEvents(
  events: AnchorEvent[],
  filters: Record<EventCategory, boolean>
): AnchorEvent[] {
  return events.filter((event) => filters[event.category]);
}

/**
 * Get upcoming events (next 7 days)
 */
export function getUpcomingEvents(count = 5): AnchorEvent[] {
  const now = new Date();
  const weekFromNow = new Date();
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  return MOCK_EVENTS
    .filter((event) => event.start >= now && event.start <= weekFromNow)
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, count);
}

/**
 * Convert AnchorEvent to FullCalendar event format
 */
export function toFullCalendarEvent(event: AnchorEvent) {
  return {
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    allDay: event.allDay ?? false,
    classNames: [`event-${event.category}`],
    extendedProps: {
      category: event.category,
      description: event.description,
      metadata: event.metadata,
    },
  };
}

/**
 * Convert all mock events to FullCalendar format
 */
export function getFullCalendarEvents(filters?: Record<EventCategory, boolean>) {
  const events = filters ? getFilteredEvents(MOCK_EVENTS, filters) : MOCK_EVENTS;
  return events.map(toFullCalendarEvent);
}
