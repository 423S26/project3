import { AnchorEvent } from "./event-types";

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
