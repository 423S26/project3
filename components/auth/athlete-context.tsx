"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSession } from "./session-provider";

interface AthleteContextValue {
  /** The athlete whose data is being viewed */
  activeAthleteId: string | null;
  /** Set the active athlete (psychologist only); pass null to view all */
  setActiveAthleteId: (id: string | null) => void;
  /** Whether the current user is a psychologist */
  isPsychologist: boolean;
  /** Loading state */
  loading: boolean;
}

const AthleteContext = createContext<AthleteContextValue>({
  activeAthleteId: null,
  setActiveAthleteId: () => {},
  isPsychologist: false,
  loading: true,
});

export function AthleteProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: sessionLoading } = useSession();
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);

  const isPsychologist = user?.role === "PSYCHOLOGIST";

  // For athletes, the active athlete is always themselves
  // For psychologists, it's the selected athlete
  const activeAthleteId = sessionLoading
    ? null
    : isPsychologist
      ? selectedAthleteId
      : user?.id ?? null;

  // Persist psychologist's selection
  useEffect(() => {
    if (isPsychologist && typeof window !== "undefined") {
      const saved = localStorage.getItem("anchor-selected-athlete");
      if (saved) setSelectedAthleteId(saved);
    }
  }, [isPsychologist]);

  const setActiveAthleteId = useCallback((id: string | null) => {
    setSelectedAthleteId(id);
    if (typeof window !== "undefined") {
      if (id === null) {
        localStorage.removeItem("anchor-selected-athlete");
      } else {
        localStorage.setItem("anchor-selected-athlete", id);
      }
    }
  }, []);

  return (
    <AthleteContext.Provider
      value={{
        activeAthleteId,
        setActiveAthleteId,
        isPsychologist,
        loading: sessionLoading,
      }}
    >
      {children}
    </AthleteContext.Provider>
  );
}

export function useAthlete() {
  return useContext(AthleteContext);
}
