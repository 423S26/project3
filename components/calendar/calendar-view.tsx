"use client";

import { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import type { EventClickArg } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { EventCategory } from "@/lib/event-types";
import { getFullCalendarEvents } from "@/lib/mock-events";
import { toLocalDateKey } from "@/lib/psych-checkins";

type ViewType = "dayGridMonth" | "timeGridWeek";

interface CalendarViewProps {
  view: ViewType;
  onViewChange: (view: ViewType) => void;
  filters: Record<EventCategory, boolean>;
  /** Check-in calendar events passed from parent (fetched from API) */
  checkInEvents?: Array<{
    id: string;
    title: string;
    start: Date;
    end: Date;
    allDay: boolean;
    classNames: string[];
    extendedProps: { category: string; description?: string; metadata?: Record<string, unknown> };
  }>;
}

/** Map event category to target page path */
const CATEGORY_ROUTE_MAP: Record<EventCategory, string> = {
  mood: "/psychological-state",
  training: "/physical-state",
  recovery: "/physical-state",
  fueling: "/physical-state",
  assessments: "/assessments",
};

export function CalendarView({ view, onViewChange, filters, checkInEvents = [] }: CalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const router = useRouter();

  // Get filtered events: mock events + API-fetched check-ins
  const mockEvents = getFullCalendarEvents(filters);
  const events = [...mockEvents, ...checkInEvents];

  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView(view);
    }
  }, [view]);

  const handleEventClick = (info: EventClickArg) => {
    const category = info.event.extendedProps?.category as EventCategory | undefined;
    if (!category) return;

    const basePath = CATEGORY_ROUTE_MAP[category] ?? "/";
    const eventStart = info.event.start;
    const dateKey = eventStart ? toLocalDateKey(eventStart) : toLocalDateKey(new Date());

    const params = new URLSearchParams({ date: dateKey });

    if (category === "mood") {
      const checkInId = info.event.extendedProps?.metadata?.checkInId as string | undefined;
      if (checkInId) {
        params.set("checkInId", checkInId);
      }
    }

    router.push(`${basePath}?${params.toString()}`);
  };

  const handlePrev = () => {
    if (calendarRef.current) calendarRef.current.getApi().prev();
  };

  const handleNext = () => {
    if (calendarRef.current) calendarRef.current.getApi().next();
  };

  const handleToday = () => {
    if (calendarRef.current) calendarRef.current.getApi().today();
  };

  return (
    <Card className="p-4">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            <Calendar className="mr-2 h-4 w-4" />
            Today
          </Button>
        </div>

        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(value) => {
            if (value) onViewChange(value as ViewType);
          }}
          variant="outline"
        >
          <ToggleGroupItem value="dayGridMonth" aria-label="Month view">
            Month
          </ToggleGroupItem>
          <ToggleGroupItem value="timeGridWeek" aria-label="Week view">
            Week
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="fc-wrapper">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin]}
          initialView={view}
          headerToolbar={false}
          events={events}
          height="auto"
          aspectRatio={1.8}
          eventDisplay="block"
          dayMaxEvents={3}
          moreLinkClick="popover"
          nowIndicator={true}
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          eventClick={handleEventClick}
        />
      </div>
    </Card>
  );
}
