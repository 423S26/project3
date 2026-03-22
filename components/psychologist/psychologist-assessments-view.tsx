"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList,
  CheckCircle,
  Clock,
  Send,
  AlertCircle,
  Smile,
  Heart,
  Zap,
  Activity,
  Brain,
  Target,
  RefreshCw,
} from "lucide-react";
import {
  PRE_GAME_QUESTIONS,
  scoreLabel,
  scoreColor,
} from "@/lib/pre-game-assessment";
import type { PreGameAnswers } from "@/lib/pre-game-assessment";

interface Assessment {
  id: string;
  athlete_id: string;
  psychologist_id: string;
  template_key: string;
  status: "assigned" | "completed";
  due_at: string | null;
  answers: PreGameAnswers | null;
  score: number | null;
  created_at: string;
  updated_at: string;
  psychologist?: { name: string; email: string } | null;
  athlete?: { name: string; email: string } | null;
}

interface CaseloadAthlete {
  athleteId: string;
  athlete: { id: string; name: string; email: string };
}

interface PsychSummary {
  mood: number | null;
  stress: number | null;
  motivation: number | null;
  label: string;
}

interface PhysicalSummary {
  avgSleepHours: number | null;
  recentWorkouts: number;
  avgEnergyNet: number | null;
  label: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function PsychologistAssessmentsView() {
  const [athletes, setAthletes] = useState<CaseloadAthlete[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>("");
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [dueAt, setDueAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [psychSummary, setPsychSummary] = useState<PsychSummary | null>(null);
  const [physicalSummary, setPhysicalSummary] = useState<PhysicalSummary | null>(null);

  useEffect(() => {
    async function loadAthletes() {
      try {
        const res = await fetch("/api/assignments");
        if (res.ok) {
          const data = await res.json();
          setAthletes(data.caseload ?? []);
        }
      } catch {
        /* non-critical */
      }
    }
    loadAthletes();
  }, []);

  const loadAssessments = useCallback(async (aId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/assessments?athleteId=${encodeURIComponent(aId)}`
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed to load assessments");
      }
      setAssessments(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSummaries = useCallback(async (aId: string) => {
    setPsychSummary(null);
    setPhysicalSummary(null);

    try {
      const checkInRes = await fetch(
        `/api/checkins?athleteId=${encodeURIComponent(aId)}`
      );
      if (checkInRes.ok) {
        const checkIns = await checkInRes.json();
        if (checkIns.length > 0) {
          const latest = checkIns[checkIns.length - 1];
          const overall =
            Math.round(
              ((latest.mood + (11 - latest.stress) + latest.motivation) / 3) * 10
            ) / 10;
          setPsychSummary({
            mood: latest.mood,
            stress: latest.stress,
            motivation: latest.motivation,
            label:
              overall >= 7 ? "Good" : overall >= 4 ? "Moderate" : "Low",
          });
        }
      }
    } catch {
      /* non-critical */
    }

    try {
      const today = new Date();
      const to = today.toISOString().split("T")[0];
      const from = new Date(today.getTime() - 7 * 86400000)
        .toISOString()
        .split("T")[0];
      const energyRes = await fetch(
        `/api/energy?from=${from}&to=${to}&athleteId=${encodeURIComponent(aId)}`
      );
      if (energyRes.ok) {
        const data = await energyRes.json();
        const days = data.days ?? [];
        const avgNet =
          days.length > 0
            ? Math.round(
                days.reduce(
                  (s: number, d: Record<string, number>) => s + (d.net ?? 0),
                  0
                ) / days.length
              )
            : null;
        setPhysicalSummary({
          avgSleepHours: null,
          recentWorkouts: days.filter(
            (d: Record<string, number>) => d.calories_out_est > 0
          ).length,
          avgEnergyNet: avgNet,
          label:
            avgNet !== null && avgNet > 0
              ? "Surplus"
              : avgNet !== null && avgNet > -300
                ? "Balanced"
                : "Deficit",
        });
      }
    } catch {
      /* non-critical */
    }
  }, []);

  function handleAthleteChange(aId: string) {
    setSelectedAthleteId(aId);
    if (aId) {
      loadAssessments(aId);
      loadSummaries(aId);
    } else {
      setAssessments([]);
      setPsychSummary(null);
      setPhysicalSummary(null);
    }
  }

  async function handleAssign() {
    if (!selectedAthleteId) return;
    setAssigning(true);
    setError(null);
    try {
      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          athleteId: selectedAthleteId,
          dueAt: dueAt || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed to assign assessment");
      }
      setDueAt("");
      await loadAssessments(selectedAthleteId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to assign");
    } finally {
      setAssigning(false);
    }
  }

  const assigned = assessments.filter((a) => a.status === "assigned");
  const completed = assessments.filter((a) => a.status === "completed");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assessments</h1>
          <p className="text-muted-foreground">
            Assign and review athlete pre-game assessments
          </p>
        </div>
        {selectedAthleteId && (
          <Button
            variant="outline"
            onClick={() => {
              loadAssessments(selectedAthleteId);
              loadSummaries(selectedAthleteId);
            }}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Select Athlete</CardTitle>
          <CardDescription>
            Choose an athlete from your caseload to assign or review assessments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <select
            value={selectedAthleteId}
            onChange={(e) => handleAthleteChange(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:max-w-xs"
          >
            <option value="">Select an athlete...</option>
            {athletes.map((a) => (
              <option key={a.athleteId} value={a.athleteId}>
                {a.athlete.name}
              </option>
            ))}
          </select>

          {selectedAthleteId && (
            <div className="flex flex-wrap items-end gap-3 rounded-md border p-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">
                  Assign Pre-Game Assessment
                </label>
                <div className="flex gap-2">
                  <input
                    type="datetime-local"
                    value={dueAt}
                    onChange={(e) => setDueAt(e.target.value)}
                    placeholder="Due date (optional)"
                    className="rounded-md border bg-background px-3 py-2 text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={handleAssign}
                    disabled={assigning}
                  >
                    <Send className="mr-1 h-3.5 w-3.5" />
                    {assigning ? "Assigning..." : "Assign"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedAthleteId && (
        <>
          <SummaryCards
            psychSummary={psychSummary}
            physicalSummary={physicalSummary}
          />

          {assigned.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5" />
                  Pending ({assigned.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y rounded-md border">
                  {assigned.map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-3">
                      <div className="space-y-1">
                        <p className="font-medium">Pre-Game Readiness</p>
                        <p className="text-xs text-muted-foreground">
                          Assigned {formatDate(a.created_at)}
                          {a.due_at && ` · Due ${formatDate(a.due_at)}`}
                        </p>
                      </div>
                      <Badge className="text-xs">Awaiting</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle className="h-5 w-5" />
                Completed ({completed.length})
              </CardTitle>
              <CardDescription>
                Review athlete assessment submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : completed.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No completed assessments for this athlete yet.
                </p>
              ) : (
                <div className="divide-y rounded-md border">
                  {completed.map((a) => (
                    <CompletedAssessmentRow key={a.id} assessment={a} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function CompletedAssessmentRow({ assessment }: { assessment: Assessment }) {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div className="p-3">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">Pre-Game Readiness</span>
            <Badge variant="secondary" className="text-xs">
              completed
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {formatDate(assessment.updated_at)}
            {assessment.athlete &&
              ` · ${assessment.athlete.name}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {assessment.score !== null && (
            <div className="text-right">
              <p className={`text-lg font-bold ${scoreColor(assessment.score)}`}>
                {assessment.score}%
              </p>
              <p className={`text-xs ${scoreColor(assessment.score)}`}>
                {scoreLabel(assessment.score)}
              </p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetail((p) => !p)}
          >
            {showDetail ? "Hide" : "Details"}
          </Button>
        </div>
      </div>
      {showDetail && assessment.answers && (
        <div className="mt-3 grid gap-2 rounded-md bg-muted/30 p-3 sm:grid-cols-2">
          {PRE_GAME_QUESTIONS.map((q) => (
            <div key={q.id} className="text-sm">
              <span className="text-muted-foreground">{q.text.split("?")[0]}:</span>{" "}
              <span className="font-medium">
                {assessment.answers![q.id] ?? "—"}/10
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCards({
  psychSummary,
  physicalSummary,
}: {
  psychSummary: PsychSummary | null;
  physicalSummary: PhysicalSummary | null;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <div className="rounded-lg bg-violet-100 p-2 text-violet-600 dark:bg-violet-950 dark:text-violet-400">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base">Psychological State</CardTitle>
            <CardDescription>Latest check-in snapshot</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {psychSummary ? (
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <Smile className="mx-auto h-4 w-4 text-muted-foreground" />
                <p className="mt-1 text-lg font-bold">{psychSummary.mood}</p>
                <p className="text-xs text-muted-foreground">Mood</p>
              </div>
              <div>
                <Zap className="mx-auto h-4 w-4 text-muted-foreground" />
                <p className="mt-1 text-lg font-bold">{psychSummary.stress}</p>
                <p className="text-xs text-muted-foreground">Stress</p>
              </div>
              <div>
                <Target className="mx-auto h-4 w-4 text-muted-foreground" />
                <p className="mt-1 text-lg font-bold">
                  {psychSummary.motivation}
                </p>
                <p className="text-xs text-muted-foreground">Motivation</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No recent check-in data available
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base">Physical State</CardTitle>
            <CardDescription>Last 7 days summary</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {physicalSummary ? (
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <Heart className="mx-auto h-4 w-4 text-muted-foreground" />
                <p className="mt-1 text-lg font-bold">
                  {physicalSummary.recentWorkouts}
                </p>
                <p className="text-xs text-muted-foreground">
                  Training days
                </p>
              </div>
              <div>
                <Activity className="mx-auto h-4 w-4 text-muted-foreground" />
                <p className="mt-1 text-lg font-bold">
                  {physicalSummary.avgEnergyNet !== null
                    ? `${physicalSummary.avgEnergyNet > 0 ? "+" : ""}${physicalSummary.avgEnergyNet}`
                    : "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Avg energy net (kcal)
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No recent physical data available
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
