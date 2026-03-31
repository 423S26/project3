"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CalendarView } from "@/components/calendar/calendar-view";
import { EventCategory, getDefaultFilters } from "@/lib/event-types";
import { toLocalDateKey, todayDateKey } from "@/lib/psych-checkins";
import type { EventClickArg } from "@fullcalendar/core";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EMOJI_SCALE } from "@/lib/emoji-scale";
import {
  ArrowLeft,
  User,
  Smile,
  Zap,
  Target,
  Clock,
  CalendarDays,
  Trophy,
} from "lucide-react";
import { fetchGoals, type AthleteGoal } from "@/lib/goals-api";
import { ReadOnlyGoalRow } from "@/components/goals/read-only-goal-list";

type ViewType = "dayGridMonth" | "timeGridWeek";

interface AthleteInfo {
  id: string;
  name: string;
  email: string;
  athleteProfile?: {
    sport?: string;
    position?: string;
    team?: string;
  }[] | null;
}

interface CheckIn {
  id: string;
  athleteId: string;
  athleteName: string;
  athleteEmail: string;
  mood: number;
  stress: number;
  motivation: number;
  notes?: string;
  brums?: {
    completed: boolean;
    items: Record<number, number>;
    subscales: Record<string, number> | null;
  };
  createdAt: string;
}

interface AthleteDrillDownProps {
  athleteId: string;
  initialDateKey?: string;
  initialFocusCheckInId?: string;
}

export function AthleteDrillDown({
  athleteId,
  initialDateKey,
  initialFocusCheckInId,
}: AthleteDrillDownProps) {
  const router = useRouter();
  const [athlete, setAthlete] = useState<AthleteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewType>("dayGridMonth");
  const [filters, setFilters] = useState(getDefaultFilters());
  const [allCheckIns, setAllCheckIns] = useState<CheckIn[]>([]);
  const [selectedDateKey, setSelectedDateKey] = useState(
    initialDateKey ?? todayDateKey()
  );
  const [dayCheckIns, setDayCheckIns] = useState<CheckIn[]>([]);
  const [focusCheckInId, setFocusCheckInId] = useState<string | null>(
    initialFocusCheckInId ?? null
  );
  const [goals, setGoals] = useState<AthleteGoal[]>([]);

  // Load athlete info + goals
  useEffect(() => {
    const load = async () => {
      try {
        const [res, goalsData] = await Promise.all([
          fetch(`/api/athletes/${athleteId}`),
          fetchGoals(athleteId),
        ]);
        if (res.ok) setAthlete(await res.json());
        setGoals(goalsData);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [athleteId]);

  // Load all check-ins for calendar
  useEffect(() => {
    const load = async () => {
      const params = new URLSearchParams({ athleteId });
      const res = await fetch(`/api/psychologist/checkins?${params.toString()}`);
      if (res.ok) setAllCheckIns(await res.json());
    };
    load();
  }, [athleteId]);

  // Load day check-ins
  const loadDayCheckIns = useCallback(async () => {
    const params = new URLSearchParams({ athleteId, date: selectedDateKey });
    const res = await fetch(`/api/psychologist/checkins?${params.toString()}`);
    if (res.ok) setDayCheckIns(await res.json());
  }, [athleteId, selectedDateKey]);

  useEffect(() => {
    loadDayCheckIns();
  }, [loadDayCheckIns]);

  const handleFilterChange = (category: EventCategory, enabled: boolean) => {
    setFilters((prev) => ({ ...prev, [category]: enabled }));
  };

  // Calendar event click within drill-down: select date + focus check-in
  const handleEventClick = (info: EventClickArg) => {
    const eventStart = info.event.start;
    if (eventStart) {
      setSelectedDateKey(toLocalDateKey(eventStart));
    }
    setFocusCheckInId(info.event.id);
  };

  // Convert check-ins to calendar events
  const checkInCalendarEvents = filters.mood
    ? allCheckIns.map((ci) => {
        const start = new Date(ci.createdAt);
        const end = new Date(start.getTime() + 15 * 60 * 1000);
        return {
          id: ci.id,
          title: ci.brums?.completed ? "Mood Profile" : "Check-In",
          start,
          end,
          allDay: false,
          classNames: ["event-mood"],
          extendedProps: {
            category: "mood" as const,
            description: `Mood ${ci.mood} · Stress ${ci.stress} · Motivation ${ci.motivation}`,
            metadata: {
              checkInId: ci.id,
              athleteId: ci.athleteId,
              mood: ci.mood,
              stress: ci.stress,
              motivation: ci.motivation,
            },
          },
        };
      })
    : [];

  const profile = Array.isArray(athlete?.athleteProfile)
    ? athlete?.athleteProfile?.[0]
    : null;

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-muted-foreground">
        Loading athlete details...
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push("/psychologist")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
        <p className="text-muted-foreground">
          Athlete not found or not assigned to you.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button + header */}
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/psychologist")}
          className="mt-1"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{athlete.name}</h1>
              <p className="text-sm text-muted-foreground">{athlete.email}</p>
            </div>
          </div>
          {profile && (
            <div className="mt-2 flex gap-2">
              {profile.sport && <Badge variant="outline">{profile.sport}</Badge>}
              {profile.position && <Badge variant="outline">{profile.position}</Badge>}
              {profile.team && <Badge variant="outline">{profile.team}</Badge>}
            </div>
          )}
        </div>
      </div>

      {/* Calendar */}
      <CalendarView
        view={view}
        onViewChange={setView}
        filters={filters}
        dbEvents={checkInCalendarEvents}
        onEventClick={handleEventClick}
      />

      {/* Day history */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Check-In History
              </CardTitle>
              <CardDescription>
                {dayCheckIns.length === 0
                  ? "No check-ins recorded for this day."
                  : `${dayCheckIns.length} check-in${dayCheckIns.length > 1 ? "s" : ""} on ${selectedDateKey}`}
              </CardDescription>
            </div>
            <input
              type="date"
              value={selectedDateKey}
              onChange={(e) => {
                setSelectedDateKey(e.target.value);
                setFocusCheckInId(null);
              }}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {dayCheckIns.map((ci) => (
            <div
              key={ci.id}
              id={`checkin-row-${ci.id}`}
              className={`rounded-lg border p-3 transition-all ${
                focusCheckInId === ci.id
                  ? "border-violet-500 bg-violet-50 ring-2 ring-violet-300 dark:bg-violet-950/30 dark:ring-violet-700"
                  : ""
              }`}
            >
              <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {new Date(ci.createdAt).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="flex items-center gap-1.5">
                  <Smile className="h-3.5 w-3.5 text-violet-500" />
                  <span>
                    {ci.mood} {EMOJI_SCALE[ci.mood]}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                  <span>
                    {ci.stress} {EMOJI_SCALE[ci.stress]}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-green-500" />
                  <span>
                    {ci.motivation} {EMOJI_SCALE[ci.motivation]}
                  </span>
                </div>
              </div>
              {ci.notes && (
                <p className="mt-2 border-t pt-2 text-xs text-muted-foreground">
                  {ci.notes}
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Athlete Goals (read-only) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Athlete Goals
          </CardTitle>
          <CardDescription>
            {goals.length === 0
              ? "This athlete hasn't set any goals yet."
              : `${goals.filter((g) => g.status === "active").length} active, ${goals.filter((g) => g.status === "completed").length} completed`}
          </CardDescription>
        </CardHeader>
        {goals.length > 0 && (
          <CardContent className="space-y-2">
            {goals.map((goal) => (
              <ReadOnlyGoalRow key={goal.id} goal={goal} />
            ))}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

