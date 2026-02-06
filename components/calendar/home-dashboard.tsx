"use client";

import { useState } from "react";
import { CalendarView } from "./calendar-view";
import { CalendarFilters } from "./calendar-filters";
import { TodayPanel } from "./today-panel";
import { EventCategory, getDefaultFilters } from "@/lib/event-types";
import { getTodaysEvents } from "@/lib/mock-events";

type ViewType = "dayGridMonth" | "timeGridWeek";

export function HomeDashboard() {
  const [view, setView] = useState<ViewType>("dayGridMonth");
  const [filters, setFilters] = useState(getDefaultFilters());

  const handleFilterChange = (category: EventCategory, enabled: boolean) => {
    setFilters((prev) => ({
      ...prev,
      [category]: enabled,
    }));
  };

  const todaysEvents = getTodaysEvents();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Your unified view of training, recovery, and wellbeing
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CalendarFilters filters={filters} onFilterChange={handleFilterChange} />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Calendar */}
        <CalendarView view={view} onViewChange={setView} filters={filters} />

        {/* Sidebar */}
        <div className="space-y-6">
          <TodayPanel events={todaysEvents} filters={filters} />
        </div>
      </div>
    </div>
  );
}
