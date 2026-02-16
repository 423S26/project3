"use client";

import { useState, useEffect } from "react";
import { useAthlete } from "@/components/auth/athlete-context";
import { Users, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Athlete {
  athleteId: string;
  assignedAt: string;
  athlete: {
    id: string;
    name: string;
    email: string;
    athlete_profiles?: {
      sport?: string;
      position?: string;
      team?: string;
    }[];
  };
}

export function CaseloadList() {
  const { activeAthleteId, setActiveAthleteId } = useAthlete();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [athleteEmail, setAthleteEmail] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);

  const loadCaseload = async () => {
    try {
      const res = await fetch("/api/assignments");
      if (res.ok) {
        const data = await res.json();
        setAthletes(data.caseload ?? []);
        // Auto-select first athlete if none selected and caseload exists
        if (!activeAthleteId && data.caseload?.length > 0) {
          setActiveAthleteId(data.caseload[0].athleteId);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCaseload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddAthlete = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAddLoading(true);

    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ athleteEmail: athleteEmail.trim() }),
      });

      if (!res.ok) {
        const error = await res.json();
        setAddError(error.error ?? "Failed to add athlete");
        setAddLoading(false);
        return;
      }

      // Success - reload caseload
      setAthleteEmail("");
      setShowAddForm(false);
      await loadCaseload();
    } catch {
      setAddError("Network error. Please try again.");
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveAthlete = async (athleteId: string) => {
    if (!confirm("Remove this athlete from your athletes?")) return;

    try {
      const res = await fetch(`/api/assignments?athleteId=${athleteId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        // Clear selection if removed athlete was selected
        if (activeAthleteId === athleteId) {
          setActiveAthleteId(null);
        }
        await loadCaseload();
      }
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Loading athletes...
      </div>
    );
  }

  return (
    <div className="space-y-2 p-4">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          My Athletes ({athletes.length})
        </label>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="rounded p-1 hover:bg-accent"
          title="Add athlete"
        >
          {showAddForm ? (
            <X className="h-3.5 w-3.5" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Add athlete form */}
      {showAddForm && (
        <form onSubmit={handleAddAthlete} className="space-y-2 rounded-lg border p-2">
          <input
            type="email"
            value={athleteEmail}
            onChange={(e) => setAthleteEmail(e.target.value)}
            placeholder="Athlete email"
            required
            className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {addError && <p className="text-xs text-destructive">{addError}</p>}
          <Button
            type="submit"
            size="sm"
            className="w-full"
            disabled={addLoading}
          >
            {addLoading ? "Adding..." : "Add Athlete"}
          </Button>
        </form>
      )}

      {/* "All Athletes" option to view entire caseload */}
      <button
        onClick={() => setActiveAthleteId(null)}
        className={`w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
          !activeAthleteId
            ? "bg-primary text-primary-foreground"
            : "hover:bg-accent"
        }`}
      >
        All Athletes
      </button>

      {/* Athlete list */}
      {athletes.length === 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          No athletes yet. Click + to add an athlete.
        </div>
      ) : (
        <div className="space-y-1">
          {athletes.map((a) => {
            const profile = a.athlete.athlete_profiles?.[0];
            return (
              <div
                key={a.athleteId}
                className={`group flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors ${
                  activeAthleteId === a.athleteId
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                }`}
              >
                <button
                  onClick={() => setActiveAthleteId(a.athleteId)}
                  className="flex-1 truncate text-left"
                >
                  {a.athlete.name}
                  {profile?.sport && (
                    <span className="ml-1 text-xs opacity-70">
                      ({profile.sport})
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handleRemoveAthlete(a.athleteId)}
                  className="ml-2 opacity-0 transition-opacity group-hover:opacity-100"
                  title="Remove athlete"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
