"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type PsychCheckIn } from "@/lib/psych-checkins";
import { fetchLatestCheckIn } from "@/lib/checkins-api";
import { useAthlete } from "@/components/auth/athlete-context";
import { EMOJI_SCALE } from "@/lib/emoji-scale";
import { SUBSCALE_LABELS, BRUMS_SUBSCALES } from "@/lib/brums-inspired";
import { Brain, Smile, Zap, Target } from "lucide-react";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function LatestCheckInCard() {
  const { activeAthleteId, isPsychologist } = useAthlete();
  const [latest, setLatest] = useState<PsychCheckIn | null>(null);

  const loadLatest = async () => {
    const athleteParam = isPsychologist ? activeAthleteId ?? undefined : undefined;
    const result = await fetchLatestCheckIn(athleteParam);
    setLatest(result);
  };

  useEffect(() => {
    if (activeAthleteId) loadLatest();
  }, [activeAthleteId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onSaved = () => loadLatest();
    window.addEventListener("anchor-checkin-saved", onSaved);
    return () => window.removeEventListener("anchor-checkin-saved", onSaved);
  }, [activeAthleteId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!latest) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="h-5 w-5 text-violet-500" />
          Latest Check-In
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {formatDate(latest.createdAt)} at {formatTime(latest.createdAt)}
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Smile className="h-4 w-4" /> Mood
          </span>
          <span className="font-medium">{latest.mood} {EMOJI_SCALE[latest.mood]}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Zap className="h-4 w-4" /> Stress
          </span>
          <span className="font-medium">{latest.stress} {EMOJI_SCALE[latest.stress]}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Target className="h-4 w-4" /> Motivation
          </span>
          <span className="font-medium">{latest.motivation} {EMOJI_SCALE[latest.motivation]}</span>
        </div>

        {latest.brums?.completed && (
          <div className="mt-2 border-t pt-2">
            <p className="mb-1 text-xs font-medium text-muted-foreground">Mood Profile</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
              {BRUMS_SUBSCALES.map((key) => (
                <div key={key} className="flex justify-between">
                  <span className="text-muted-foreground">{SUBSCALE_LABELS[key]}</span>
                  <span className="font-medium">{latest.brums!.subscales[key]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {latest.notes && (
          <p className="mt-2 border-t pt-2 text-xs text-muted-foreground line-clamp-2">
            {latest.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
