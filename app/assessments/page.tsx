"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "@/components/auth/session-provider";
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
  Clock,
  Send,
  AlertCircle,
  Smile,
  Heart,
  Zap,
  Activity,
  Brain,
  Target,
} from "lucide-react";
import {
  PRE_GAME_QUESTIONS,
  computePreGameScore,
  isPreGameComplete,
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

export default function AssessmentsPage() {
  const { user } = useSession();

  if (!user) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  return <AthleteAssessmentsView athleteId={user.id} />;
}

function AthleteAssessmentsView({ athleteId }: { athleteId: string }) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [psychSummary, setPsychSummary] = useState<PsychSummary | null>(null);
  const [physicalSummary, setPhysicalSummary] = useState<PhysicalSummary | null>(null);

  const loadAssessments = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/assessments");
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed to load assessments");
      }
      setAssessments(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load assessments");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSummaries = useCallback(async () => {
    try {
      const checkInRes = await fetch("/api/checkins");
      if (checkInRes.ok) {
        const checkIns = await checkInRes.json();
        if (checkIns.length > 0) {
          const latest = checkIns[checkIns.length - 1];
          const avg = (a: number, b: number, c: number) =>
            Math.round(((a + b + c) / 3) * 10) / 10;
          const overall = avg(latest.mood, 11 - latest.stress, latest.motivation);
          setPsychSummary({
            mood: latest.mood,
            stress: latest.stress,
            motivation: latest.motivation,
            label: overall >= 7 ? "Good" : overall >= 4 ? "Moderate" : "Low",
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
        `/api/energy?from=${from}&to=${to}`
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

  useEffect(() => {
    loadAssessments();
    loadSummaries();
  }, [loadAssessments, loadSummaries]);

  const assigned = assessments.filter((a) => a.status === "assigned");
  const completed = assessments.filter((a) => a.status === "completed");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assessments</h1>
        <p className="text-muted-foreground">
          Complete assigned assessments and track your readiness
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <SummaryCards psychSummary={psychSummary} physicalSummary={physicalSummary} />

      {assigned.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              Due Assessments ({assigned.length})
            </CardTitle>
            <CardDescription>
              Assessments assigned by your psychologist
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {assigned.map((a) => (
              <AssessmentForm
                key={a.id}
                assessment={a}
                onCompleted={loadAssessments}
              />
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="h-5 w-5" />
            Assessment History ({completed.length})
          </CardTitle>
          <CardDescription>
            Your completed assessments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : completed.length === 0 ? (
            <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed text-center text-sm text-muted-foreground">
              {assigned.length === 0
                ? "No assessments yet. Your psychologist will assign them when needed."
                : "Complete your due assessments above to see them here."}
            </div>
          ) : (
            <div className="divide-y rounded-md border">
              {completed.map((a) => (
                <CompletedAssessmentRow key={a.id} assessment={a} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AssessmentForm({
  assessment,
  onCompleted,
}: {
  assessment: Assessment;
  onCompleted: () => void;
}) {
  const [answers, setAnswers] = useState<PreGameAnswers>({});
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function handleSubmit() {
    if (!isPreGameComplete(answers)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/assessments?id=${assessment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (res.ok) {
        onCompleted();
      }
    } finally {
      setSaving(false);
    }
  }

  const previewScore = isPreGameComplete(answers)
    ? computePreGameScore(answers)
    : null;

  if (!expanded) {
    return (
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-1">
          <p className="font-medium">Pre-Game Readiness Assessment</p>
          <p className="text-xs text-muted-foreground">
            Assigned by {assessment.psychologist?.name ?? "your psychologist"}
            {assessment.due_at && ` · Due ${formatDate(assessment.due_at)}`}
          </p>
        </div>
        <Button size="sm" onClick={() => setExpanded(true)}>
          Start
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <p className="font-medium">Pre-Game Readiness Assessment</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(false)}
        >
          Collapse
        </Button>
      </div>

      {PRE_GAME_QUESTIONS.map((q) => (
        <div key={q.id} className="space-y-2">
          <label className="text-sm font-medium">{q.text}</label>
          <div className="flex items-center gap-3">
            <span className="w-24 text-xs text-muted-foreground">
              {q.minLabel}
            </span>
            <input
              type="range"
              min={q.min}
              max={q.max}
              value={answers[q.id] ?? 5}
              onChange={(e) =>
                setAnswers((prev) => ({
                  ...prev,
                  [q.id]: Number(e.target.value),
                }))
              }
              className="flex-1"
            />
            <span className="w-24 text-right text-xs text-muted-foreground">
              {q.maxLabel}
            </span>
            <span className="w-8 text-center text-sm font-medium">
              {answers[q.id] ?? 5}
            </span>
          </div>
        </div>
      ))}

      {previewScore !== null && (
        <div className="rounded-md bg-muted/50 p-3 text-center">
          <p className="text-sm text-muted-foreground">Readiness Score</p>
          <p className={`text-2xl font-bold ${scoreColor(previewScore)}`}>
            {previewScore}%
          </p>
          <p className={`text-sm font-medium ${scoreColor(previewScore)}`}>
            {scoreLabel(previewScore)}
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          onClick={handleSubmit}
          disabled={saving || !isPreGameComplete(answers)}
        >
          <Send className="mr-2 h-4 w-4" />
          {saving ? "Submitting..." : "Submit Assessment"}
        </Button>
        <Button variant="ghost" onClick={() => setExpanded(false)}>
          Cancel
        </Button>
      </div>
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
            {assessment.psychologist &&
              ` · Assigned by ${assessment.psychologist.name}`}
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
