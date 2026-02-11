"use client";

import { useState, useEffect } from "react";
import { useAthlete } from "./athlete-context";
import { Users } from "lucide-react";

interface Athlete {
  id: string;
  name: string;
  email: string;
  athleteProfile?: {
    sport?: string;
    position?: string;
    team?: string;
  };
}

export function AthleteSwitcher() {
  const { isPsychologist, activeAthleteId, setActiveAthleteId } = useAthlete();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isPsychologist) return;
    const load = async () => {
      try {
        const res = await fetch("/api/athletes");
        if (res.ok) {
          const data = await res.json();
          setAthletes(data);
          // Auto-select first athlete if none selected
          if (!activeAthleteId && data.length > 0) {
            setActiveAthleteId(data[0].id);
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isPsychologist]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isPsychologist) return null;

  if (loading) {
    return (
      <div className="rounded-lg border p-3 text-sm text-muted-foreground">
        Loading athletes...
      </div>
    );
  }

  if (athletes.length === 0) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        No athletes registered yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label
        htmlFor="athlete-select"
        className="flex items-center gap-2 text-xs font-medium text-muted-foreground"
      >
        <Users className="h-3.5 w-3.5" />
        Viewing Athlete
      </label>
      <select
        id="athlete-select"
        value={activeAthleteId ?? ""}
        onChange={(e) => setActiveAthleteId(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {athletes.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
            {a.athleteProfile?.sport ? ` (${a.athleteProfile.sport})` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
