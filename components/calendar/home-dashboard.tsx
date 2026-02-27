"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { CalendarView } from "./calendar-view";
import { CalendarFilters } from "./calendar-filters";
import { TodayPanel } from "./today-panel";
import { LatestCheckInCard } from "@/components/psych/latest-checkin-card";
import { buttonVariants } from "@/components/ui/button";
import { EventCategory, AnchorEvent, getDefaultFilters } from "@/lib/event-types";
import { getTodaysEvents } from "@/lib/mock-events";
import { toLocalDateKey } from "@/lib/psych-checkins";
import { fetchEvents } from "@/lib/physical-state-api";
import { toFullCalendarEvent } from "@/lib/mock-events";
import { useAthlete } from "@/components/auth/athlete-context";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewType = "dayGridMonth" | "timeGridWeek";

export function HomeDashboard() {
  const { activeAthleteId, isPsychologist } = useAthlete();
  const [view, setView] = useState<ViewType>("dayGridMonth");
  const [filters, setFilters] = useState(getDefaultFilters());
  const [dbEvents, setDbEvents] = useState<AnchorEvent[]>([]);

  const athleteParam = isPsychologist ? activeAthleteId ?? undefined : undefined;

  // Compute a wide date range for fetching (3 months back, 2 months forward)
  const getDateRange = useCallback(() => {
    const now = new Date();
    const from = new Date(now);
    from.setMonth(from.getMonth() - 3);
    const to = new Date(now);
    to.setMonth(to.getMonth() + 2);
    return {
      from: toLocalDateKey(from),
      to: toLocalDateKey(to),
    };
  }, []);

  // Fetch unified events from API (recovery, workouts, meals, check-ins)
  const loadEvents = useCallback(async () => {
    if (!activeAthleteId) return;
    const { from, to } = getDateRange();
    const events = await fetchEvents(from, to, athleteParam);
    setDbEvents(events);
  }, [activeAthleteId, athleteParam, getDateRange]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Refresh on check-in saved (or any physical-state data saved)
  useEffect(() => {
    const onSaved = () => { loadEvents(); };
    window.addEventListener("anchor-checkin-saved", onSaved);
    window.addEventListener("anchor-physical-state-saved", onSaved);
    return () => {
      window.removeEventListener("anchor-checkin-saved", onSaved);
      window.removeEventListener("anchor-physical-state-saved", onSaved);
    };
  }, [loadEvents]);

  const handleFilterChange = (category: EventCategory, enabled: boolean) => {
    setFilters((prev) => ({
      ...prev,
      [category]: enabled,
    }));
  };

  // Convert DB events to FullCalendar format, applying filters
  const dbCalendarEvents = dbEvents
    .filter((e) => filters[e.category])
    .map(toFullCalendarEvent);

  // Build today's events for the Today panel (DB + mock)
  const mockTodaysEvents = getTodaysEvents();
  const todayKey = toLocalDateKey(new Date());
  const dbTodaysEvents = dbEvents.filter((e) => {
    const eventDate = toLocalDateKey(e.start);
    return eventDate === todayKey;
  });
  const todaysEvents = [...mockTodaysEvents, ...dbTodaysEvents].sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Your unified view of training, recovery, and wellbeing
          </p>
        </div>
        <Link href="/help" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          <HelpCircle className="h-4 w-4" />
          Help?
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CalendarFilters filters={filters} onFilterChange={handleFilterChange} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <CalendarView
          view={view}
          onViewChange={setView}
          filters={filters}
          dbEvents={dbCalendarEvents}
        />

        <div className="space-y-6">
          {filters.mood && <LatestCheckInCard />}
          <TodayPanel events={todaysEvents} filters={filters} />
        </div>
      </div>
    </div>
  );
}
