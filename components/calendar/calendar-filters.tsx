"use client";

import { Toggle } from "@/components/ui/toggle";
import { Badge } from "@/components/ui/badge";
import {
  EventCategory,
  ALL_CATEGORIES,
  CATEGORY_CONFIG,
} from "@/lib/event-types";
import { Dumbbell, Battery, Smile, Utensils, ClipboardList, Video } from "lucide-react";

interface CalendarFiltersProps {
  filters: Record<EventCategory, boolean>;
  onFilterChange: (category: EventCategory, enabled: boolean) => void;
}

const CATEGORY_ICONS: Record<EventCategory, React.ReactNode> = {
  training: <Dumbbell className="h-4 w-4" />,
  recovery: <Battery className="h-4 w-4" />,
  mood: <Smile className="h-4 w-4" />,
  fueling: <Utensils className="h-4 w-4" />,
  assessments: <ClipboardList className="h-4 w-4" />,
  sessions: <Video className="h-4 w-4" />,
};

export function CalendarFilters({
  filters,
  onFilterChange,
}: CalendarFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {ALL_CATEGORIES.map((category) => {
        const config = CATEGORY_CONFIG[category];
        const isActive = filters[category];

        return (
          <Toggle
            key={category}
            pressed={isActive}
            onPressedChange={(pressed) => onFilterChange(category, pressed)}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <span className={isActive ? config.textColor : "text-muted-foreground"}>
              {CATEGORY_ICONS[category]}
            </span>
            <span>{config.label}</span>
            {isActive && (
              <Badge
                variant={category}
                className="ml-1 h-2 w-2 rounded-full p-0"
              />
            )}
          </Toggle>
        );
      })}
    </div>
  );
}
