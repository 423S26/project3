"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { EventClickArg } from "@fullcalendar/core";
import { CalendarView } from "@/components/calendar/calendar-view";
import { CalendarFilters } from "@/components/calendar/calendar-filters";
import { TodayPanel } from "@/components/calendar/today-panel";
import { EventCategory, getDefaultFilters } from "@/lib/event-types";
import { toLocalDateKey, todayDateKey } from "@/lib/psych-checkins";
import { useAthlete } from "@/components/auth/athlete-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Users,
  Activity,
  AlertTriangle,
  ClipboardList,
  ExternalLink,
  Smile,
  Zap,
  Target,
  CalendarDays,
  HelpCircle,
} from "lucide-react";
import { EMOJI_SCALE } from "@/lib/emoji-scale";

type ViewType = "dayGridMonth" | "timeGridWeek";

interface CaseloadCheckIn {
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

interface CaseloadAthlete {
  athleteId: string;
  assignedAt: string;
  athlete: {
    id: string;
    name: string;
    email: string;
    athlete_profiles?: {
      sport?: string;
      position?: string;
      team?: string;
    }[];
  };
}

export function PsychologistDashboard() {
  const router = useRouter();
  const { activeAthleteId } = useAthlete();
  const [view, setView] = useState<ViewType>("dayGridMonth");
  const [filters, setFilters] = useState(getDefaultFilters());
  const [allCheckIns, setAllCheckIns] = useState<CaseloadCheckIn[]>([]);
  const [selectedDateKey, setSelectedDateKey] = useState(todayDateKey());
  const [dayCheckIns, setDayCheckIns] = useState<CaseloadCheckIn[]>([]);
  const [recentCheckIns, setRecentCheckIns] = useState<CaseloadCheckIn[]>([]);
  const [caseload, setCaseload] = useState<CaseloadAthlete[]>([]);
  const [last7CheckIns, setLast7CheckIns] = useState<CaseloadCheckIn[]>([]);

  // Load caseload athletes
  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/assignments");
      if (res.ok) {
        const data = await res.json();
        setCaseload(data.caseload ?? []);
      }
    };
    load();
  }, []);

  // Load last-7-days check-ins for quick stats
  useEffect(() => {
    const load = async () => {
      const now = new Date();
      const from = new Date(now);
      from.setDate(from.getDate() - 7);
      const params = new URLSearchParams({
        from: toLocalDateKey(from),
        to: toLocalDateKey(now),
      });
      const res = await fetch(`/api/psychologist/checkins?${params.toString()}`);
      if (res.ok) {
        setLast7CheckIns(await res.json());
      }
    };
    load();
  }, []);

  // Fetch all check-ins (for calendar)
  useEffect(() => {
    const load = async () => {
      const params = new URLSearchParams();
      if (activeAthleteId) params.set("athleteId", activeAthleteId);
      const res = await fetch(`/api/psychologist/checkins?${params.toString()}`);
      if (res.ok) setAllCheckIns(await res.json());
    };
    load();
  }, [activeAthleteId]);

  // Fetch check-ins for selected date
  useEffect(() => {
    const load = async () => {
      const params = new URLSearchParams({ date: selectedDateKey });
      if (activeAthleteId) params.set("athleteId", activeAthleteId);
      const res = await fetch(`/api/psychologist/checkins?${params.toString()}`);
      if (res.ok) setDayCheckIns(await res.json());
    };
    load();
  }, [selectedDateKey, activeAthleteId]);

  // Fetch recent check-ins (for current selection)
  useEffect(() => {
    const load = async () => {
      const params = new URLSearchParams({ limit: "5", order: "desc" });
      if (activeAthleteId) params.set("athleteId", activeAthleteId);
      const res = await fetch(`/api/psychologist/checkins?${params.toString()}`);
      if (res.ok) setRecentCheckIns(await res.json());
    };
    load();
  }, [activeAthleteId]);

  // Quick stats
  const stats = useMemo(() => {
    const needsAttention = last7CheckIns.filter(
      (ci) => ci.mood <= 3 || ci.stress >= 8
    );
    const uniqueAthletes = new Set(needsAttention.map((ci) => ci.athleteId));
    return {
      athleteCount: caseload.length,
      checkInsThisWeek: last7CheckIns.length,
      needsAttentionCount: uniqueAthletes.size,
    };
  }, [caseload, last7CheckIns]);

  const handleFilterChange = (category: EventCategory, enabled: boolean) => {
    setFilters((prev) => ({ ...prev, [category]: enabled }));
  };

  // Calendar event click: navigate to athlete drill-down
  const handleCalendarEventClick = (info: EventClickArg) => {
    const athleteId = info.event.extendedProps?.metadata?.athleteId as string | undefined;
    const eventStart = info.event.start;
    const dateKey = eventStart ? toLocalDateKey(eventStart) : todayDateKey();
    const checkInId = info.event.id;

    if (athleteId) {
      const params = new URLSearchParams({ date: dateKey });
      if (checkInId) params.set("checkInId", checkInId);
      router.push(`/psychologist/athletes/${athleteId}?${params.toString()}`);
    }
  };

  // Convert check-ins to calendar events
  const checkInCalendarEvents = filters.mood
    ? allCheckIns.map((ci) => {
        const start = new Date(ci.createdAt);
        const end = new Date(start.getTime() + 15 * 60 * 1000);
        return {
          id: ci.id,
          title: `${ci.athleteName}: Check-In`,
          start,
          end,
          allDay: false,
          classNames: ["event-mood"],
          extendedProps: {
            category: "mood" as const,
            description: `${ci.athleteName} - Mood ${ci.mood} · Stress ${ci.stress} · Motivation ${ci.motivation}`,
            metadata: {
              athleteId: ci.athleteId,
              athleteName: ci.athleteName,
              checkInId: ci.id,
              mood: ci.mood,
              stress: ci.stress,
              motivation: ci.motivation,
            },
          },
        };
      })
    : [];

  // Build today's events for the Today panel
  const todayCheckInEvents = filters.mood
    ? dayCheckIns
        .filter((ci) => toLocalDateKey(new Date(ci.createdAt)) === todayDateKey())
        .map((ci) => {
          const start = new Date(ci.createdAt);
          const end = new Date(start.getTime() + 15 * 60 * 1000);
          return {
            id: ci.id,
            title: `${ci.athleteName}: Check-In`,
            category: "mood" as const,
            start,
            end,
            allDay: false,
            description: `Mood ${ci.mood} · Stress ${ci.stress} · Motivation ${ci.motivation}`,
            metadata: { athleteId: ci.athleteId } as Record<string, unknown>,
          };
        })
    : [];

  const todaysEvents = todayCheckInEvents.sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your athletes and their wellbeing
          </p>
          {activeAthleteId && (
            <p className="mt-1 text-sm text-primary">
              Filtering by selected athlete
            </p>
          )}
        </div>
        <Link href="/help" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          <HelpCircle className="h-4 w-4" />
          Help?
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-blue-100 p-2.5 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.athleteCount}</p>
              <p className="text-xs text-muted-foreground">Athletes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-green-100 p-2.5 text-green-600">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.checkInsThisWeek}</p>
              <p className="text-xs text-muted-foreground">Check-Ins (Last 7 Days)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className={`rounded-lg p-2.5 ${stats.needsAttentionCount > 0 ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500"}`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.needsAttentionCount}</p>
              <p className="text-xs text-muted-foreground">Need Attention (Low Mood / High Stress)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CalendarFilters filters={filters} onFilterChange={handleFilterChange} />
      </div>

      {/* Calendar + Today Panel */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <CalendarView
          view={view}
          onViewChange={setView}
          filters={filters}
          dbEvents={checkInCalendarEvents}
          onEventClick={handleCalendarEventClick}
        />

        <div className="space-y-6">
          <TodayPanel events={todaysEvents} filters={filters} />
        </div>
      </div>

      {/* Athlete Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Athlete Overview
          </CardTitle>
          <CardDescription>
            {caseload.length} athlete{caseload.length !== 1 ? "s" : ""} assigned to you
          </CardDescription>
        </CardHeader>
        <CardContent>
          {caseload.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No athletes assigned yet. Use the sidebar to add athletes.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {caseload.map((a) => {
                const profile = a.athlete.athlete_profiles?.[0];
                return (
                  <div
                    key={a.athleteId}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{a.athlete.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{a.athlete.email}</p>
                      {profile?.sport && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {profile.sport}
                          {profile.team ? ` · ${profile.team}` : ""}
                        </Badge>
                      )}
                    </div>
                    <button
                      onClick={() =>
                        router.push(`/psychologist/athletes/${a.athleteId}`)
                      }
                      className="ml-2 rounded-md p-2 hover:bg-accent"
                      title="Open athlete details"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Check-Ins (for selected athlete or caseload) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Check-Ins
            {activeAthleteId && recentCheckIns.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({recentCheckIns[0]?.athleteName})
              </span>
            )}
          </CardTitle>
          <CardDescription>
            {activeAthleteId
              ? "Latest check-ins for the selected athlete"
              : "Select an athlete from the sidebar to see recent check-ins"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!activeAthleteId ? (
            <p className="text-sm text-muted-foreground">
              Select an athlete from the sidebar to view their recent check-ins.
            </p>
          ) : recentCheckIns.length === 0 ? (
            <p className="text-sm text-muted-foreground">No check-ins found.</p>
          ) : (
            <div className="space-y-3">
              {recentCheckIns.map((ci) => (
                <button
                  key={ci.id}
                  onClick={() =>
                    router.push(
                      `/psychologist/athletes/${ci.athleteId}?date=${toLocalDateKey(new Date(ci.createdAt))}&checkInId=${ci.id}`
                    )
                  }
                  className="w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent/50"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {new Date(ci.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      at{" "}
                      {new Date(ci.createdAt).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                    {!activeAthleteId && (
                      <span className="text-xs font-medium">{ci.athleteName}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <Smile className="h-3.5 w-3.5 text-violet-500" />
                      <span>{ci.mood} {EMOJI_SCALE[ci.mood]}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5 text-amber-500" />
                      <span>{ci.stress} {EMOJI_SCALE[ci.stress]}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="h-3.5 w-3.5 text-green-500" />
                      <span>{ci.motivation} {EMOJI_SCALE[ci.motivation]}</span>
                    </div>
                  </div>
                  {ci.notes && (
                    <p className="mt-1 truncate text-xs text-muted-foreground">{ci.notes}</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Day Details with date picker */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Day Details
              </CardTitle>
              <CardDescription>
                {dayCheckIns.length} check-in{dayCheckIns.length !== 1 ? "s" : ""} on {selectedDateKey}
              </CardDescription>
            </div>
            <input
              type="date"
              value={selectedDateKey}
              onChange={(e) => setSelectedDateKey(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
        </CardHeader>
        <CardContent>
          {dayCheckIns.length === 0 ? (
            <p className="text-sm text-muted-foreground">No check-ins recorded for this day.</p>
          ) : (
            <div className="space-y-3">
              {dayCheckIns.map((ci) => (
                <div key={ci.id} className="rounded-lg border p-3">
                  <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {new Date(ci.createdAt).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                    <span className="font-medium">{ci.athleteName}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <Smile className="h-3.5 w-3.5 text-violet-500" />
                      <span>Mood: {ci.mood}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5 text-amber-500" />
                      <span>Stress: {ci.stress}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="h-3.5 w-3.5 text-green-500" />
                      <span>Motivation: {ci.motivation}</span>
                    </div>
                  </div>
                  {ci.notes && (
                    <p className="mt-2 text-xs text-muted-foreground">{ci.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
