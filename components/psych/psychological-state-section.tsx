"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckInForm } from "./check-in-form";
import { CheckInHistory } from "./check-in-history";
import { todayDateKey, type PsychCheckIn } from "@/lib/psych-checkins";
import { fetchLatestCheckIn, fetchCheckInsForDate } from "@/lib/checkins-api";
import { useAthlete } from "@/components/auth/athlete-context";
import { EMOJI_SCALE } from "@/lib/emoji-scale";
import { SUBSCALE_LABELS, BRUMS_SUBSCALES } from "@/lib/brums-inspired";
import { Smile, Zap, Target, Clock } from "lucide-react";

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString();
}

function subscaleColor(key: string, val: number): string {
  if (key === "vigor") {
    if (val >= 12) return "bg-green-500";
    if (val >= 6) return "bg-amber-400";
    return "bg-red-400";
  }
  if (val <= 4) return "bg-green-500";
  if (val <= 10) return "bg-amber-400";
  return "bg-red-400";
}

export interface PsychologicalStateSectionProps {
  initialDateKey?: string;
  initialFocusCheckInId?: string;
}

export function PsychologicalStateSection({
  initialDateKey,
  initialFocusCheckInId,
}: PsychologicalStateSectionProps) {
  const { activeAthleteId, isPsychologist } = useAthlete();
  const [selectedDateKey, setSelectedDateKey] = useState(
    initialDateKey ?? todayDateKey()
  );
  const [focusCheckInId, setFocusCheckInId] = useState<string | null>(
    initialFocusCheckInId ?? null
  );
  const [latest, setLatest] = useState<PsychCheckIn | null>(null);
  const [dayCheckIns, setDayCheckIns] = useState<PsychCheckIn[]>([]);

  const athleteParam = isPsychologist ? activeAthleteId ?? undefined : undefined;

  const refreshData = useCallback(async () => {
    const [latestResult, dayResult] = await Promise.all([
      fetchLatestCheckIn(athleteParam),
      fetchCheckInsForDate(selectedDateKey, athleteParam),
    ]);
    setLatest(latestResult);
    setDayCheckIns(dayResult);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("anchor-checkin-saved"));
    }
  }, [selectedDateKey, athleteParam]);

  useEffect(() => {
    if (activeAthleteId) {
      refreshData();
    }
  }, [refreshData, activeAthleteId]);

  const handleSaved = () => {
    refreshData();
  };

  const handleDateKeyChange = (key: string) => {
    setSelectedDateKey(key);
    setFocusCheckInId(null);
  };

  return (
    <div className="space-y-6">
      <CheckInForm
        onSaved={handleSaved}
        dateKey={selectedDateKey}
        onDateKeyChange={handleDateKeyChange}
      />

      <CheckInHistory
        dateKey={selectedDateKey}
        checkIns={dayCheckIns}
        focusCheckInId={focusCheckInId}
      />

      {latest && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Latest Check-In (Overall)</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {formatRelativeTime(latest.createdAt)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Smile className="h-5 w-5 text-violet-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Mood</p>
                  <p className="text-lg font-semibold">
                    {latest.mood} {EMOJI_SCALE[latest.mood]}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Zap className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Stress</p>
                  <p className="text-lg font-semibold">
                    {latest.stress} {EMOJI_SCALE[latest.stress]}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Target className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Motivation</p>
                  <p className="text-lg font-semibold">
                    {latest.motivation} {EMOJI_SCALE[latest.motivation]}
                  </p>
                </div>
              </div>
            </div>

            {latest.brums?.completed && (
              <div className="rounded-lg border p-4">
                <p className="mb-3 text-sm font-medium">Mood Profile (Subscales)</p>
                <div className="space-y-2">
                  {BRUMS_SUBSCALES.map((key) => {
                    const val = latest.brums!.subscales[key];
                    const pct = Math.round((val / 16) * 100);
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <span className="w-24 text-sm text-muted-foreground">
                          {SUBSCALE_LABELS[key]}
                        </span>
                        <div className="flex-1">
                          <div className="h-2.5 w-full rounded-full bg-muted">
                            <div
                              className={`h-2.5 rounded-full transition-all ${subscaleColor(key, val)}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                        <span className="w-10 text-right text-sm font-medium">{val}/16</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {latest.notes && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Notes:</span> {latest.notes}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
