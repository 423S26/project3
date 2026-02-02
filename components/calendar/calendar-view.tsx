"use client";

import { useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { EventCategory } from "@/lib/event-types";
import { getFullCalendarEvents } from "@/lib/mock-events";

type ViewType = "dayGridMonth" | "timeGridWeek";

interface CalendarViewProps {
  view: ViewType;
  onViewChange: (view: ViewType) => void;
  filters: Record<EventCategory, boolean>;
}

export function CalendarView({ view, onViewChange, filters }: CalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);

  // Get filtered events
  const events = getFullCalendarEvents(filters);

  // Update calendar view when view prop changes
  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView(view);
    }
  }, [view]);

  const handlePrev = () => {
    if (calendarRef.current) {
      calendarRef.current.getApi().prev();
    }
  };

  const handleNext = () => {
    if (calendarRef.current) {
      calendarRef.current.getApi().next();
    }
  };

  const handleToday = () => {
    if (calendarRef.current) {
      calendarRef.current.getApi().today();
    }
  };

  return (
    <Card className="p-4">
      {/* Calendar Header */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Navigation */}
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

        {/* View Toggle */}
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

      {/* Calendar */}
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
        />
      </div>
    </Card>
  );
}
