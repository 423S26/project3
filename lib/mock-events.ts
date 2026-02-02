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
 */
export const MOCK_EVENTS: AnchorEvent[] = [
  // Today's events
  {
    id: "schedule-1",
    title: "Team Standup",
    category: "schedule",
    start: relativeDate(0, 9, 0),
    end: relativeDate(0, 9, 30),
    description: "Daily team sync meeting",
  },
  {
    id: "workout-1",
    title: "Morning Run",
    category: "workouts",
    start: relativeDate(0, 6, 30),
    end: relativeDate(0, 7, 30),
    description: "5K run around the park",
  },
  {
    id: "meals-1",
    title: "Lunch Prep",
    category: "meals",
    start: relativeDate(0, 12, 0),
    end: relativeDate(0, 12, 30),
    description: "Prepare healthy lunch",
  },

  // Tomorrow
  {
    id: "schedule-2",
    title: "ESOF 423 Class",
    category: "schedule",
    start: relativeDate(1, 10, 0),
    end: relativeDate(1, 11, 30),
    description: "Software engineering class",
  },
  {
    id: "bills-1",
    title: "Electric Bill Due",
    category: "bills",
    start: relativeDate(1),
    allDay: true,
    description: "Monthly electric bill payment",
    metadata: { amount: 85.50 },
  },

  // This week
  {
    id: "workout-2",
    title: "Gym Session",
    category: "workouts",
    start: relativeDate(2, 17, 0),
    end: relativeDate(2, 18, 30),
    description: "Strength training",
  },
  {
    id: "schedule-3",
    title: "Work Shift",
    category: "schedule",
    start: relativeDate(2, 14, 0),
    end: relativeDate(2, 20, 0),
    description: "Afternoon shift at work",
  },
  {
    id: "meals-2",
    title: "Meal Prep Sunday",
    category: "meals",
    start: relativeDate(3, 10, 0),
    end: relativeDate(3, 12, 0),
    description: "Prepare meals for the week",
  },

  // Next week
  {
    id: "bills-2",
    title: "Rent Due",
    category: "bills",
    start: relativeDate(5),
    allDay: true,
    description: "Monthly rent payment",
    metadata: { amount: 1200.00 },
  },
  {
    id: "schedule-4",
    title: "Project Meeting",
    category: "schedule",
    start: relativeDate(5, 14, 0),
    end: relativeDate(5, 15, 0),
    description: "Sprint planning meeting",
  },
  {
    id: "workout-3",
    title: "Yoga Class",
    category: "workouts",
    start: relativeDate(6, 8, 0),
    end: relativeDate(6, 9, 0),
    description: "Weekly yoga session",
  },
  {
    id: "schedule-5",
    title: "Doctor Appointment",
    category: "schedule",
    start: relativeDate(7, 11, 0),
    end: relativeDate(7, 12, 0),
    description: "Annual checkup",
  },
  {
    id: "bills-3",
    title: "Internet Bill Due",
    category: "bills",
    start: relativeDate(8),
    allDay: true,
    description: "Monthly internet payment",
    metadata: { amount: 65.00 },
  },

  // More variety
  {
    id: "meals-3",
    title: "Dinner with Friends",
    category: "meals",
    start: relativeDate(4, 19, 0),
    end: relativeDate(4, 21, 0),
    description: "Restaurant dinner",
    metadata: { estimatedCost: 45.00 },
  },
  {
    id: "workout-4",
    title: "Swimming",
    category: "workouts",
    start: relativeDate(8, 7, 0),
    end: relativeDate(8, 8, 0),
    description: "Morning swim at the pool",
  },
  {
    id: "schedule-6",
    title: "Study Group",
    category: "schedule",
    start: relativeDate(3, 15, 0),
    end: relativeDate(3, 17, 0),
    description: "ESOF 423 study group",
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
