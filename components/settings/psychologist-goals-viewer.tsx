"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchGoals, type AthleteGoal } from "@/lib/goals-api";
import { ReadOnlyGoalList } from "@/components/goals/read-only-goal-list";

interface CaseloadAthlete {
  id: string;
  name: string;
  email: string;
}

interface RawCaseloadItem {
  athleteId?: string;
  athlete?: { id?: string; name?: string; email?: string } | null;
}

function normalizeCaseload(raw: RawCaseloadItem[]): CaseloadAthlete[] {
  return raw
    .map((item) => ({
      id: item.athleteId ?? item.athlete?.id ?? "",
      name: item.athlete?.name ?? "Unknown Athlete",
      email: item.athlete?.email ?? "",
    }))
    .filter((a) => a.id !== "");
}

export function PsychologistGoalsViewer() {
  const [athletes, setAthletes] = useState<CaseloadAthlete[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>("");
  const [goals, setGoals] = useState<AthleteGoal[]>([]);
  const [loadingAthletes, setLoadingAthletes] = useState(true);
  const [loadingGoals, setLoadingGoals] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/assignments");
        if (res.ok) {
          const data = await res.json();
          const caseload = normalizeCaseload(data.caseload ?? []);
          setAthletes(caseload);
          if (caseload.length > 0) {
            setSelectedAthleteId(caseload[0].id);
          }
        }
      } catch {
        /* non-critical */
      }
      setLoadingAthletes(false);
    })();
  }, []);

  const loadGoals = useCallback(async (athleteId: string) => {
    if (!athleteId) return;
    setLoadingGoals(true);
    const data = await fetchGoals(athleteId);
    setGoals(data);
    setLoadingGoals(false);
  }, []);

  useEffect(() => {
    if (selectedAthleteId) {
      loadGoals(selectedAthleteId);
    }
  }, [selectedAthleteId, loadGoals]);

  if (loadingAthletes) {
    return (
      <p className="text-sm text-muted-foreground">Loading athletes...</p>
    );
  }

  if (athletes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No athletes assigned to you yet.
      </p>
    );
  }

  const selectedAthlete = athletes.find((a) => a.id === selectedAthleteId);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <label className="space-y-1 flex-1 max-w-xs">
          <span className="text-sm font-medium">Select Athlete</span>
          <select
            value={selectedAthleteId}
            onChange={(e) => setSelectedAthleteId(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
          >
            {athletes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        {selectedAthlete && (
          <p className="text-xs text-muted-foreground mt-auto">
            {selectedAthlete.email}
          </p>
        )}
      </div>

      {loadingGoals ? (
        <p className="text-sm text-muted-foreground">Loading goals...</p>
      ) : (
        <ReadOnlyGoalList goals={goals} />
      )}
    </div>
  );
}
