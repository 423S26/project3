"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnchorEvent, CATEGORY_CONFIG, EventCategory } from "@/lib/event-types";
import { Clock, CalendarDays } from "lucide-react";

interface TodayPanelProps {
  events: AnchorEvent[];
  filters: Record<EventCategory, boolean>;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function TodayPanel({ events, filters }: TodayPanelProps) {
  const today = new Date();
  const filteredEvents = events.filter((event) => filters[event.category]);

  // Sort by start time
  const sortedEvents = [...filteredEvents].sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarDays className="h-5 w-5" />
          Today
        </CardTitle>
        <p className="text-sm text-muted-foreground">{formatDate(today)}</p>
      </CardHeader>
      <CardContent>
        {sortedEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-8 w-8 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">
              No events scheduled for today
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedEvents.map((event) => {
              const config = CATEGORY_CONFIG[event.category];
              return (
                <div
                  key={event.id}
                  className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50"
                >
                  <div
                    className={`mt-0.5 h-2 w-2 rounded-full ${config.bgColor}`}
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium leading-none">{event.title}</p>
                      <Badge variant={event.category} className="text-xs">
                        {config.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {event.allDay
                        ? "All day"
                        : `${formatTime(event.start)}${
                            event.end ? ` - ${formatTime(event.end)}` : ""
                          }`}
                    </p>
                    {event.description && (
                      <p className="text-xs text-muted-foreground">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
