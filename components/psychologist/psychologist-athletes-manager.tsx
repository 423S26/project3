"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Plus, RefreshCw, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CaseloadAthlete {
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

export function PsychologistAthletesManager() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [athletes, setAthletes] = useState<CaseloadAthlete[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [athleteName, setAthleteName] = useState("");
  const [athleteEmail, setAthleteEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const res = await fetch("/api/assignments");
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed to load athletes");
      }
      const data = await res.json();
      setAthletes(data.caseload ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load athletes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addAthlete(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          athleteName: athleteName.trim(),
          athleteEmail: athleteEmail.trim(),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed to add athlete");
      }
      setAthleteName("");
      setAthleteEmail("");
      setShowAdd(false);
      await load();
    } catch (e2) {
      setSaveError(e2 instanceof Error ? e2.message : "Failed to add athlete");
    } finally {
      setSaving(false);
    }
  }

  async function removeAthlete(athleteId: string) {
    if (!confirm("Remove this athlete from your athletes?")) return;
    try {
      const res = await fetch(`/api/assignments?athleteId=${encodeURIComponent(athleteId)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed to remove athlete");
      }
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to remove athlete");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Athletes</h1>
          <p className="text-muted-foreground">Manage your caseload and open an athlete&apos;s drill-down view.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowAdd((p) => !p)}>
            {showAdd ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showAdd ? "Close" : "Add athlete"}
          </Button>
        </div>
      </div>

      {showAdd && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Add athlete
            </CardTitle>
            <CardDescription>
              Enter the athlete&apos;s <strong>name</strong> and <strong>email</strong> exactly as they registered.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={addAthlete} className="grid gap-3 sm:max-w-xl">
              <label className="space-y-1">
                <span className="text-sm font-medium">Athlete name</span>
                <input
                  value={athleteName}
                  onChange={(e) => setAthleteName(e.target.value)}
                  placeholder="e.g. Jordan Smith"
                  required
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium">Athlete email</span>
                <input
                  type="email"
                  value={athleteEmail}
                  onChange={(e) => setAthleteEmail(e.target.value)}
                  placeholder="e.g. jordan@example.com"
                  required
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </label>
              {saveError && <p className="text-sm text-destructive">{saveError}</p>}
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Adding..." : "Add athlete"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowAdd(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">My Athletes ({athletes.length})</CardTitle>
          <CardDescription>Click an athlete to open their details.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : athletes.length === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
              No athletes yet. Click <strong>Add athlete</strong> to assign one.
            </div>
          ) : (
            <div className="divide-y rounded-md border">
              {athletes.map((a) => {
                const profile = a.athlete.athlete_profiles?.[0];
                return (
                  <div
                    key={a.athleteId}
                    onClick={() => router.push(`/psychologist/athletes/${a.athleteId}`)}
                    className="flex cursor-pointer items-center justify-between gap-3 p-3 transition-colors hover:bg-accent/50"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{a.athlete.name}</span>
                        <span className="text-xs text-muted-foreground">{a.athlete.email}</span>
                      </div>
                      {(profile?.sport || profile?.team || profile?.position) && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {[profile?.sport, profile?.team, profile?.position].filter(Boolean).join(" \u2022 ")}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeAthlete(a.athleteId);
                      }}
                      className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      title="Remove athlete"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
