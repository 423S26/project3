"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

interface AthleteContextValue {
  /** The athlete whose data is being viewed */
  activeAthleteId: string | null;
  /** Set the active athlete (psychologist only) */
  setActiveAthleteId: (id: string) => void;
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
  const { data: session, status } = useSession();
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);

  const isPsychologist = session?.user?.role === "PSYCHOLOGIST";

  // For athletes, the active athlete is always themselves
  // For psychologists, it's the selected athlete
  const activeAthleteId =
    status === "loading"
      ? null
      : isPsychologist
        ? selectedAthleteId
        : session?.user?.id ?? null;

  // Persist psychologist's selection
  useEffect(() => {
    if (isPsychologist && typeof window !== "undefined") {
      const saved = localStorage.getItem("anchor-selected-athlete");
      if (saved) setSelectedAthleteId(saved);
    }
  }, [isPsychologist]);

  const setActiveAthleteId = useCallback(
    (id: string) => {
      setSelectedAthleteId(id);
      if (typeof window !== "undefined") {
        localStorage.setItem("anchor-selected-athlete", id);
      }
    },
    []
  );

  return (
    <AthleteContext.Provider
      value={{
        activeAthleteId,
        setActiveAthleteId,
        isPsychologist,
        loading: status === "loading",
      }}
    >
      {children}
    </AthleteContext.Provider>
  );
}

export function useAthlete() {
  return useContext(AthleteContext);
}
