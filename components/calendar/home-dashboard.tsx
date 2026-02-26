"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CalendarView } from "./calendar-view";
import { CalendarFilters } from "./calendar-filters";
import { TodayPanel } from "./today-panel";
import { LatestCheckInCard } from "@/components/psych/latest-checkin-card";
import { buttonVariants } from "@/components/ui/button";
import { EventCategory, getDefaultFilters } from "@/lib/event-types";
import { getTodaysEvents } from "@/lib/mock-events";
import { toCheckInCalendarEvent, toLocalDateKey, type PsychCheckIn } from "@/lib/psych-checkins";
import { fetchCheckIns, fetchCheckInsForDate } from "@/lib/checkins-api";
import { useAthlete } from "@/components/auth/athlete-context";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewType = "dayGridMonth" | "timeGridWeek";

export function HomeDashboard() {
  const { activeAthleteId, isPsychologist } = useAthlete();
  const [view, setView] = useState<ViewType>("dayGridMonth");
  const [filters, setFilters] = useState(getDefaultFilters());
  const [allCheckIns, setAllCheckIns] = useState<PsychCheckIn[]>([]);
  const [todayCheckIns, setTodayCheckIns] = useState<PsychCheckIn[]>([]);

  const athleteParam = isPsychologist ? activeAthleteId ?? undefined : undefined;

  // Fetch check-ins from API
  useEffect(() => {
    if (!activeAthleteId) return;
    const load = async () => {
      const [all, today] = await Promise.all([
        fetchCheckIns(athleteParam),
        fetchCheckInsForDate(toLocalDateKey(new Date()), athleteParam),
      ]);
      setAllCheckIns(all);
      setTodayCheckIns(today);
    };
    load();
  }, [activeAthleteId, athleteParam]);

  // Refresh on check-in saved
  useEffect(() => {
    const onSaved = async () => {
      const [all, today] = await Promise.all([
        fetchCheckIns(athleteParam),
        fetchCheckInsForDate(toLocalDateKey(new Date()), athleteParam),
      ]);
      setAllCheckIns(all);
      setTodayCheckIns(today);
    };
    window.addEventListener("anchor-checkin-saved", onSaved);
    return () => window.removeEventListener("anchor-checkin-saved", onSaved);
  }, [athleteParam]);

  const handleFilterChange = (category: EventCategory, enabled: boolean) => {
    setFilters((prev) => ({
      ...prev,
      [category]: enabled,
    }));
  };

  // Convert DB check-ins to calendar events
  const checkInCalendarEvents = filters.mood
    ? allCheckIns.map(toCheckInCalendarEvent)
    : [];

  // Build today's events for the Today panel
  const mockTodaysEvents = getTodaysEvents();
  const todayCheckInEvents = filters.mood
    ? todayCheckIns.map((c) => {
        const start = new Date(c.createdAt);
        const end = new Date(start.getTime() + 15 * 60 * 1000);
        const summary = `Mood ${c.mood} · Stress ${c.stress} · Motivation ${c.motivation}`;
        return {
          id: c.id,
          title: c.brums?.completed ? "Mood Profile" : "Check-In",
          category: "mood" as const,
          start,
          end,
          allDay: false,
          description: c.notes ? `${summary}. ${c.notes}` : summary,
          metadata: { mood: c.mood, stress: c.stress, motivation: c.motivation } as Record<string, unknown>,
        };
      })
    : [];
  const todaysEvents = [...mockTodaysEvents, ...todayCheckInEvents].sort(
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
          checkInEvents={checkInCalendarEvents}
        />

        <div className="space-y-6">
          {filters.mood && <LatestCheckInCard />}
          <TodayPanel events={todaysEvents} filters={filters} />
        </div>
      </div>
    </div>
  );
}
