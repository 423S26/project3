"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchLatestCheckIn } from "@/lib/checkins-api";
import { useAthlete } from "@/components/auth/athlete-context";
import { EMOJI_SCALE } from "@/lib/emoji-scale";
import { Smile, Zap, Target } from "lucide-react";

export function PsychologicalStateStats() {
  const { activeAthleteId, isPsychologist } = useAthlete();
  const [mood, setMood] = useState<number | null>(null);
  const [stress, setStress] = useState<number | null>(null);
  const [motivation, setMotivation] = useState<number | null>(null);

  const refresh = async () => {
    const athleteParam = isPsychologist ? activeAthleteId ?? undefined : undefined;
    const latest = await fetchLatestCheckIn(athleteParam);
    if (latest) {
      setMood(latest.mood);
      setStress(latest.stress);
      setMotivation(latest.motivation);
    } else {
      setMood(null);
      setStress(null);
      setMotivation(null);
    }
  };

  useEffect(() => {
    if (activeAthleteId) refresh();
  }, [activeAthleteId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onSaved = () => refresh();
    window.addEventListener("anchor-checkin-saved", onSaved);
    return () => window.removeEventListener("anchor-checkin-saved", onSaved);
  }, [activeAthleteId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Today&apos;s Mood</CardTitle>
          <Smile className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {mood != null ? `${mood} ${EMOJI_SCALE[mood]}` : "--"}
          </div>
          <p className="text-xs text-muted-foreground">
            From latest check-in
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Stress Level</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stress != null ? `${stress} ${EMOJI_SCALE[stress]}` : "--"}
          </div>
          <p className="text-xs text-muted-foreground">
            From latest check-in
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Motivation</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {motivation != null ? `${motivation} ${EMOJI_SCALE[motivation]}` : "--"}
          </div>
          <p className="text-xs text-muted-foreground">
            From latest check-in
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
