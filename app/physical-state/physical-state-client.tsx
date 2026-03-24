"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAthlete } from "@/components/auth/athlete-context";
import {
  Battery, Dumbbell, Utensils, Moon, Heart, Activity, Plus, RefreshCw, Search, Link2,
  Trash2, Check, AlertCircle, TrendingUp, TrendingDown, Flame, Scale, Zap,
} from "lucide-react";
import {
  fetchRecovery,
  createRecoveryEntry,
  fetchWorkoutSessions,
  createWorkoutSession,
  fetchWorkoutTemplates,
  createWorkoutTemplate,
  fetchMeals,
  createMeal,
  searchEdamamFoods,
  searchExercises,
  saveExercise,
  syncFitbit,
  syncOura,
  fetchEnergy,
  fetchAthleteProfile,
  updateAthleteProfile,
  type RecoveryEntry,
  type WorkoutSession,
  type WorkoutTemplate,
  type MealLog,
  type EdamamFood,
  type ExerciseSearchResult,
  type DayEnergy,
} from "@/lib/physical-state-api";

type Tab = "recovery" | "training" | "fueling";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "recovery", label: "Recovery", icon: <Battery className="h-4 w-4" /> },
  { key: "training", label: "Training", icon: <Dumbbell className="h-4 w-4" /> },
  { key: "fueling", label: "Fueling", icon: <Utensils className="h-4 w-4" /> },
];

function emitSaved() {
  window.dispatchEvent(new Event("anchor-physical-state-saved"));
}

/* ═══════════════════════════════════════════════════════════
   SPARKLINE (pure SVG)
   ═══════════════════════════════════════════════════════════ */

function Sparkline({
  data,
  color = "hsl(var(--primary))",
  width = 120,
  height = 32,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return <div style={{ width, height }} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 2;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - pad * 2) - pad;
    return `${x},${y}`;
  });
  const gradId = `spark-${Math.random().toString(36).slice(2, 8)}`;
  const areaPoints = [...points, `${width},${height}`, `0,${height}`];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.15} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={areaPoints.join(" ")} fill={`url(#${gradId})`} />
      <polyline points={points.join(" ")} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   SKELETON PLACEHOLDER
   ═══════════════════════════════════════════════════════════ */

function SkeletonPulse({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className}`} />;
}

/* ═══════════════════════════════════════════════════════════
   30-DAY INSIGHTS SECTION
   ═══════════════════════════════════════════════════════════ */

function dayKey(d: Date) {
  return d.toISOString().split("T")[0];
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function InsightsTrends({ athleteId, isPsychologist }: { athleteId: string | null; isPsychologist: boolean }) {
  const [loading, setLoading] = useState(true);
  const [sleepData, setSleepData] = useState<{ daily: number[]; avg: number; delta: number }>({ daily: [], avg: 0, delta: 0 });
  const [loadData, setLoadData] = useState<{ daily: number[]; avg: number; delta: number }>({ daily: [], avg: 0, delta: 0 });
  const [energyData, setEnergyData] = useState<{ daily: number[]; avg: number; delta: number }>({ daily: [], avg: 0, delta: 0 });

  const athleteParam = isPsychologist ? athleteId ?? undefined : undefined;

  const load = useCallback(async () => {
    if (!athleteId) return;
    setLoading(true);

    const today = new Date();
    const from60 = dayKey(daysAgo(59));
    const from30 = dayKey(daysAgo(29));
    const toStr = dayKey(today);

    const [recovery, sessions, energy] = await Promise.all([
      fetchRecovery(from60, toStr, athleteParam),
      fetchWorkoutSessions(from60, toStr, athleteParam),
      fetchEnergy(from60, toStr, athleteParam),
    ]);

    // Build date-keyed maps for current 30d and prior 30d
    const current30Start = daysAgo(29);
    const prior30Start = daysAgo(59);

    // --- SLEEP ---
    const sleepByDate = new Map<string, number>();
    recovery.forEach((r) => {
      if (r.sleep_minutes != null) sleepByDate.set(r.date, r.sleep_minutes / 60);
    });
    const sleepCurrent: number[] = [];
    const sleepPrior: number[] = [];
    for (let i = 0; i < 30; i++) {
      const cd = dayKey(new Date(current30Start.getTime() + i * 86400000));
      const pd = dayKey(new Date(prior30Start.getTime() + i * 86400000));
      sleepCurrent.push(sleepByDate.get(cd) ?? 0);
      sleepPrior.push(sleepByDate.get(pd) ?? 0);
    }
    const sleepAvgCurrent = sleepCurrent.reduce((a, b) => a + b, 0) / Math.max(sleepCurrent.filter(v => v > 0).length, 1);
    const sleepAvgPrior = sleepPrior.reduce((a, b) => a + b, 0) / Math.max(sleepPrior.filter(v => v > 0).length, 1);

    // --- TRAINING LOAD (duration × RPE) ---
    const loadByDate = new Map<string, number>();
    sessions.forEach((s) => {
      const d = s.started_at.split("T")[0];
      const sessionLoad = (s.duration_min ?? 30) * (s.rpe ?? 5);
      loadByDate.set(d, (loadByDate.get(d) ?? 0) + sessionLoad);
    });
    const loadCurrent: number[] = [];
    const loadPrior: number[] = [];
    for (let i = 0; i < 30; i++) {
      const cd = dayKey(new Date(current30Start.getTime() + i * 86400000));
      const pd = dayKey(new Date(prior30Start.getTime() + i * 86400000));
      loadCurrent.push(loadByDate.get(cd) ?? 0);
      loadPrior.push(loadByDate.get(pd) ?? 0);
    }
    const loadSumCurrent = loadCurrent.reduce((a, b) => a + b, 0);
    const loadSumPrior = loadPrior.reduce((a, b) => a + b, 0);
    const loadAvgCurrent = loadSumCurrent / 30;
    const loadAvgPrior = loadSumPrior / 30;

    // --- ENERGY NET ---
    const netByDate = new Map<string, number>();
    energy.days.forEach((d) => { netByDate.set(d.date, d.net); });
    const netCurrent: number[] = [];
    const netPrior: number[] = [];
    for (let i = 0; i < 30; i++) {
      const cd = dayKey(new Date(current30Start.getTime() + i * 86400000));
      const pd = dayKey(new Date(prior30Start.getTime() + i * 86400000));
      netCurrent.push(netByDate.get(cd) ?? 0);
      netPrior.push(netByDate.get(pd) ?? 0);
    }
    const netAvgCurrent = netCurrent.reduce((a, b) => a + b, 0) / Math.max(netCurrent.filter(v => v !== 0).length, 1);
    const netAvgPrior = netPrior.reduce((a, b) => a + b, 0) / Math.max(netPrior.filter(v => v !== 0).length, 1);

    setSleepData({ daily: sleepCurrent, avg: sleepAvgCurrent, delta: sleepAvgCurrent - sleepAvgPrior });
    setLoadData({ daily: loadCurrent, avg: loadAvgCurrent, delta: loadAvgCurrent - loadAvgPrior });
    setEnergyData({ daily: netCurrent, avg: netAvgCurrent, delta: netAvgCurrent - netAvgPrior });
    setLoading(false);
  }, [athleteId, athleteParam]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const onSaved = () => { load(); };
    window.addEventListener("anchor-physical-state-saved", onSaved);
    window.addEventListener("anchor-checkin-saved", onSaved);
    return () => {
      window.removeEventListener("anchor-physical-state-saved", onSaved);
      window.removeEventListener("anchor-checkin-saved", onSaved);
    };
  }, [load]);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="py-5 space-y-3">
              <SkeletonPulse className="h-3 w-20" />
              <SkeletonPulse className="h-7 w-16" />
              <SkeletonPulse className="h-8 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const tiles = [
    {
      label: "Avg Sleep",
      value: `${sleepData.avg.toFixed(1)}h`,
      delta: sleepData.delta,
      deltaFmt: `${sleepData.delta >= 0 ? "+" : ""}${sleepData.delta.toFixed(1)}h`,
      daily: sleepData.daily,
      color: "hsl(270, 70%, 60%)",
      icon: <Moon className="h-4 w-4 text-violet-500" />,
      goodUp: true,
    },
    {
      label: "Avg Training Load",
      value: Math.round(loadData.avg).toString(),
      delta: loadData.delta,
      deltaFmt: `${loadData.delta >= 0 ? "+" : ""}${Math.round(loadData.delta)}`,
      daily: loadData.daily,
      color: "hsl(221, 83%, 53%)",
      icon: <Dumbbell className="h-4 w-4 text-blue-500" />,
      goodUp: true,
    },
    {
      label: "Avg Energy Net",
      value: `${Math.round(energyData.avg)} cal`,
      delta: energyData.delta,
      deltaFmt: `${energyData.delta >= 0 ? "+" : ""}${Math.round(energyData.delta)}`,
      daily: energyData.daily,
      color: "hsl(142, 76%, 36%)",
      icon: <Flame className="h-4 w-4 text-green-500" />,
      goodUp: true,
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">30-Day Trends</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {tiles.map((t) => {
          const isPositive = t.goodUp ? t.delta >= 0 : t.delta <= 0;
          return (
            <Card key={t.label} className="overflow-hidden">
              <CardContent className="py-4 space-y-2">
                <div className="flex items-center gap-2">
                  {t.icon}
                  <span className="text-xs font-medium text-muted-foreground">{t.label}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{t.value}</span>
                  <span className={`text-xs font-medium ${isPositive ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
                    {t.deltaFmt}
                  </span>
                </div>
                <Sparkline data={t.daily} color={t.color} width={160} height={28} />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */

export function PhysicalStateClient() {
  const { activeAthleteId, isPsychologist } = useAthlete();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>("recovery");

  // Show integration feedback from OAuth callback redirects
  const integrationSuccess = searchParams.get("integration_success");
  const integrationError = searchParams.get("integration_error");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Physical State</h1>
        <p className="text-muted-foreground">Track your recovery, training load, and fueling</p>
      </div>

      {/* Integration feedback */}
      {integrationSuccess && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
          <Check className="h-4 w-4" />
          <span className="text-sm">
            Successfully connected to <strong>{integrationSuccess}</strong>!
          </span>
        </div>
      )}
      {integrationError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">
            Integration error: <strong>{integrationError}</strong>. Please try again.
          </span>
        </div>
      )}

      {/* 30-Day Insights */}
      <InsightsTrends athleteId={activeAthleteId} isPsychologist={isPsychologist} />

      {/* Energy & Readiness card */}
      <EnergyReadinessCard athleteId={activeAthleteId} isPsychologist={isPsychologist} />

      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl border bg-muted/40 p-1 shadow-sm">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "recovery" && <RecoveryTab athleteId={activeAthleteId} isPsychologist={isPsychologist} />}
      {activeTab === "training" && <TrainingTab athleteId={activeAthleteId} isPsychologist={isPsychologist} />}
      {activeTab === "fueling" && <FuelingTab athleteId={activeAthleteId} isPsychologist={isPsychologist} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ENERGY & READINESS CARD
   ═══════════════════════════════════════════════════════════ */

function EnergyReadinessCard({ athleteId, isPsychologist }: { athleteId: string | null; isPsychologist: boolean }) {
  const [todayEnergy, setTodayEnergy] = useState<DayEnergy | null>(null);
  const [recovery, setRecovery] = useState<RecoveryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [bodyweightKg, setBodyweightKg] = useState<number | null>(null);
  const [hasBodyweight, setHasBodyweight] = useState(true);

  const athleteParam = isPsychologist ? athleteId ?? undefined : undefined;
  const todayKey = new Date().toISOString().split("T")[0];

  const load = useCallback(async () => {
    if (!athleteId) return;
    setLoading(true);
    const [energyData, recoveryData] = await Promise.all([
      fetchEnergy(todayKey, todayKey, athleteParam),
      fetchRecovery(todayKey, todayKey, athleteParam),
    ]);
    setTodayEnergy(energyData.days.find((d) => d.date === todayKey) ?? null);
    setHasBodyweight(energyData.hasBodyweight);
    setBodyweightKg(energyData.bodyweightKg);
    setRecovery(recoveryData);
    setLoading(false);
  }, [athleteId, athleteParam, todayKey]);

  useEffect(() => { load(); }, [load]);

  // Listen for changes
  useEffect(() => {
    const onSaved = () => { load(); };
    window.addEventListener("anchor-physical-state-saved", onSaved);
    window.addEventListener("anchor-checkin-saved", onSaved);
    return () => {
      window.removeEventListener("anchor-physical-state-saved", onSaved);
      window.removeEventListener("anchor-checkin-saved", onSaved);
    };
  }, [load]);

  // Compute insight flags
  const flags: { message: string; color: string; icon: React.ReactNode }[] = [];

  // Recovery signals
  const latestRecovery = recovery.length > 0 ? recovery[0] : null;
  const sleepHours = latestRecovery?.sleep_minutes ? latestRecovery.sleep_minutes / 60 : null;

  if (sleepHours != null && sleepHours < 6) {
    flags.push({
      message: `Low sleep (${sleepHours.toFixed(1)}h) — consider lighter training today`,
      color: "text-green-600 dark:text-green-400",
      icon: <Moon className="h-4 w-4 text-green-500" />,
    });
  }

  if (todayEnergy) {
    if (todayEnergy.calories_in > 0 && todayEnergy.calories_out_total > 0 && todayEnergy.net < -500) {
      flags.push({
        message: `Large energy deficit (${Math.round(todayEnergy.net)} cal) — prioritize fueling`,
        color: "text-orange-600 dark:text-orange-400",
        icon: <TrendingDown className="h-4 w-4 text-orange-500" />,
      });
    }
    if (todayEnergy.calories_out_est > 400 && sleepHours != null && sleepHours < 7) {
      flags.push({
        message: "High training load + poor sleep — recovery risk",
        color: "text-violet-600 dark:text-violet-400",
        icon: <AlertCircle className="h-4 w-4 text-violet-500" />,
      });
    }
  }

  if (!hasBodyweight && !isPsychologist) {
    flags.push({
      message: "Set your bodyweight in Settings for calorie estimates",
      color: "text-blue-600 dark:text-blue-400",
      icon: <Scale className="h-4 w-4 text-blue-500" />,
    });
  }

  if (todayEnergy && todayEnergy.calories_in > 0 && todayEnergy.net > 0) {
    flags.push({
      message: `Good energy balance (+${Math.round(todayEnergy.net)} cal surplus)`,
      color: "text-green-600 dark:text-green-400",
      icon: <TrendingUp className="h-4 w-4 text-green-500" />,
    });
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-5 space-y-3">
          <SkeletonPulse className="h-4 w-32" />
          <div className="grid gap-3 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => <SkeletonPulse key={i} className="h-16 w-full" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5" />
          Energy & Readiness
        </CardTitle>
        <CardDescription>Today&apos;s energy balance and performance signals</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Energy summary strip */}
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Utensils className="h-4 w-4 text-orange-500" />
              <span className="text-xs font-medium text-muted-foreground">Calories In</span>
            </div>
            <p className="mt-1 text-xl font-bold text-orange-600 dark:text-orange-400">
              {todayEnergy ? Math.round(todayEnergy.calories_in) : 0}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-medium text-muted-foreground">Est. Burn</span>
            </div>
            <p className="mt-1 text-xl font-bold text-blue-600 dark:text-blue-400">
              {todayEnergy ? Math.round(todayEnergy.calories_out_est) : 0}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Battery className="h-4 w-4 text-green-500" />
              <span className="text-xs font-medium text-muted-foreground">Wearable Burn</span>
            </div>
            <p className="mt-1 text-xl font-bold text-green-600 dark:text-green-400">
              {todayEnergy?.calories_out_wearable != null ? Math.round(todayEnergy.calories_out_wearable) : "—"}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4" />
              <span className="text-xs font-medium text-muted-foreground">Net</span>
            </div>
            <p className={`mt-1 text-xl font-bold ${
              todayEnergy && todayEnergy.net >= 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}>
              {todayEnergy ? (todayEnergy.net >= 0 ? "+" : "") + Math.round(todayEnergy.net) : 0}
            </p>
          </div>
        </div>

        {/* Quality label */}
        {todayEnergy?.quality && todayEnergy.quality !== "no_data" && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {todayEnergy.quality === "wearable_only" && "Wearable data"}
              {todayEnergy.quality === "estimate_only" && "Estimated"}
              {todayEnergy.quality === "mixed" && "Wearable + Estimates"}
              {todayEnergy.quality === "missing_weight" && "Set bodyweight for estimates"}
              {todayEnergy.quality === "intake_only" && "Intake only"}
            </Badge>
            {bodyweightKg && (
              <span className="text-xs text-muted-foreground">{bodyweightKg} kg</span>
            )}
          </div>
        )}

        {/* Insight flags */}
        {flags.length > 0 && (
          <div className="space-y-2">
            {flags.map((flag, i) => (
              <div key={i} className={`flex items-center gap-2 text-sm ${flag.color}`}>
                {flag.icon}
                <span>{flag.message}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════
   RECOVERY TAB
   ═══════════════════════════════════════════════════════════ */

function RecoveryTab({ athleteId, isPsychologist }: { athleteId: string | null; isPsychologist: boolean }) {
  const [entries, setEntries] = useState<RecoveryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);

  const athleteParam = isPsychologist ? athleteId ?? undefined : undefined;

  const load = useCallback(async () => {
    if (!athleteId) return;
    setLoading(true);
    const data = await fetchRecovery(undefined, undefined, athleteParam);
    setEntries(data);
    setLoading(false);
  }, [athleteId, athleteParam]);

  useEffect(() => { load(); }, [load]);

  const handleSync = async (provider: "fitbit" | "oura") => {
    setSyncing(provider);
    try {
      if (provider === "fitbit") await syncFitbit();
      else await syncOura();
      await load();
      emitSaved();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Sync failed");
    }
    setSyncing(null);
  };

  return (
    <div className="space-y-4">
      {/* Wearable connections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Link2 className="h-5 w-5" />
            Wearable Connections
          </CardTitle>
          <CardDescription>Connect your wearable to auto-sync recovery data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            {/* Fitbit */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-blue-500" />
                <span className="font-medium">Fitbit</span>
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" asChild>
                  <a href="/api/integrations/fitbit/authorize">Connect</a>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSync("fitbit")}
                  disabled={syncing === "fitbit"}
                >
                  <RefreshCw className={`h-3 w-3 ${syncing === "fitbit" ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>

            {/* Oura */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Moon className="h-5 w-5 text-purple-500" />
                <span className="font-medium">Oura</span>
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" asChild>
                  <a href="/api/integrations/oura/authorize">Connect</a>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSync("oura")}
                  disabled={syncing === "oura"}
                >
                  <RefreshCw className={`h-3 w-3 ${syncing === "oura" ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>

            {/* WHOOP – coming soon */}
            <div className="flex items-center justify-between rounded-lg border border-dashed p-3 opacity-60">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-yellow-500" />
                <span className="font-medium">WHOOP</span>
              </div>
              <Badge variant="outline" className="text-xs">Coming soon</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual entry toggle */}
      {!isPsychologist && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm((p) => !p)}>
            <Plus className="h-4 w-4" />
            {showForm ? "Cancel" : "Log Recovery Manually"}
          </Button>
        </div>
      )}

      {showForm && <RecoveryForm onSaved={() => { setShowForm(false); load(); emitSaved(); }} />}

      {/* Recovery entries */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Recovery</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => <SkeletonPulse key={i} className="h-16 w-full" />)}
            </div>
          ) : entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No recovery data yet. Connect a wearable or log manually.
            </p>
          ) : (
            <div className="space-y-2">
              {entries.slice(0, 14).map((e) => (
                <div key={e.id} className="flex items-start justify-between rounded-lg border p-3 transition-colors hover:bg-muted/30">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{e.date}</span>
                      <Badge variant="recovery" className="text-xs">{e.source}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {e.sleep_minutes != null && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-violet-500/10 px-2 py-0.5 text-xs font-medium text-violet-700 dark:text-violet-300">
                          <Moon className="h-3 w-3" />
                          {Math.round(e.sleep_minutes / 60 * 10) / 10}h
                        </span>
                      )}
                      {e.sleep_score != null && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-violet-500/10 px-2 py-0.5 text-xs font-medium text-violet-700 dark:text-violet-300">
                          Score {e.sleep_score}
                        </span>
                      )}
                      {e.resting_hr != null && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-300">
                          <Heart className="h-3 w-3" />
                          {e.resting_hr} bpm
                        </span>
                      )}
                      {e.hrv_ms != null && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-300">
                          HRV {e.hrv_ms}ms
                        </span>
                      )}
                    </div>
                    {e.notes && <p className="text-xs text-muted-foreground">{e.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RecoveryForm({ onSaved }: { onSaved: () => void }) {
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [sleepHours, setSleepHours] = useState("");
  const [sleepScore, setSleepScore] = useState("");
  const [restingHr, setRestingHr] = useState("");
  const [hrvMs, setHrvMs] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createRecoveryEntry({
        date,
        sleepMinutes: sleepHours ? Math.round(parseFloat(sleepHours) * 60) : undefined,
        sleepScore: sleepScore ? parseInt(sleepScore) : undefined,
        restingHr: restingHr ? parseInt(restingHr) : undefined,
        hrvMs: hrvMs ? parseFloat(hrvMs) : undefined,
        notes: notes || undefined,
      });
      onSaved();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save");
    }
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Log Recovery</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm font-medium">Date</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground" required />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">Sleep (hours)</span>
            <input type="number" step="0.1" min="0" max="24" value={sleepHours} onChange={(e) => setSleepHours(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="e.g. 7.5" />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">Sleep Score (0-100)</span>
            <input type="number" min="0" max="100" value={sleepScore} onChange={(e) => setSleepScore(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="e.g. 85" />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">Resting HR (bpm)</span>
            <input type="number" min="30" max="200" value={restingHr} onChange={(e) => setRestingHr(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="e.g. 52" />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium">HRV (ms)</span>
            <input type="number" step="0.1" min="0" value={hrvMs} onChange={(e) => setHrvMs(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="e.g. 45" />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium">Notes</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" rows={2} placeholder="How did you feel?" />
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Recovery"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════
   TRAINING TAB
   ═══════════════════════════════════════════════════════════ */

function TrainingTab({ athleteId, isPsychologist }: { athleteId: string | null; isPsychologist: boolean }) {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [sessionType, setSessionType] = useState<"strength" | "sport_session">("strength");

  const athleteParam = isPsychologist ? athleteId ?? undefined : undefined;

  const load = useCallback(async () => {
    if (!athleteId) return;
    setLoading(true);
    const [s, t] = await Promise.all([
      fetchWorkoutSessions(undefined, undefined, athleteParam),
      fetchWorkoutTemplates(athleteParam),
    ]);
    setSessions(s);
    setTemplates(t);
    setLoading(false);
  }, [athleteId, athleteParam]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      {/* Actions */}
      {!isPsychologist && (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => { setShowSessionForm((p) => !p); setSessionType("strength"); }}>
            <Dumbbell className="h-4 w-4" />
            {showSessionForm && sessionType === "strength" ? "Cancel" : "Log Strength Workout"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setShowSessionForm((p) => !p); setSessionType("sport_session"); }}>
            <Activity className="h-4 w-4" />
            {showSessionForm && sessionType === "sport_session" ? "Cancel" : "Log Sport Session"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowTemplateForm((p) => !p)}>
            <Plus className="h-4 w-4" />
            {showTemplateForm ? "Cancel" : "Create Template"}
          </Button>
        </div>
      )}

      {showSessionForm && (
        <WorkoutSessionForm
          type={sessionType}
          templates={templates}
          onSaved={() => { setShowSessionForm(false); load(); emitSaved(); }}
        />
      )}

      {showTemplateForm && (
        <TemplateForm onSaved={() => { setShowTemplateForm(false); load(); }} />
      )}

      {/* Templates */}
      {templates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Workout Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {templates.map((t) => (
                <div key={t.id} className="rounded-lg border p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{t.name}</span>
                    <Badge variant="training" className="text-xs">{t.type}</Badge>
                    {t.sport && <Badge variant="outline" className="text-xs">{t.sport}</Badge>}
                  </div>
                  {t.workout_template_exercises && t.workout_template_exercises.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {t.workout_template_exercises.map((ex) => ex.exercise_name).join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Workouts</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => <SkeletonPulse key={i} className="h-20 w-full" />)}
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No workouts logged yet.</p>
          ) : (
            <div className="space-y-2">
              {sessions.slice(0, 20).map((s) => {
                const sessionLoad = s.duration_min && s.rpe ? s.duration_min * s.rpe : null;
                return (
                  <div key={s.id} className="rounded-lg border p-3 space-y-2 transition-colors hover:bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{s.name}</span>
                        <Badge variant="training" className="text-xs">{s.type === "sport_session" ? "Sport" : "Strength"}</Badge>
                        {s.sport && <Badge variant="outline" className="text-xs">{s.sport}</Badge>}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(s.started_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {s.duration_min != null && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                          {s.duration_min} min
                        </span>
                      )}
                      {s.rpe != null && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                          RPE {s.rpe}/10
                        </span>
                      )}
                      {s.intensity && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          {s.intensity}
                        </span>
                      )}
                      {sessionLoad != null && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                          <Zap className="h-3 w-3" />
                          Load {sessionLoad}
                        </span>
                      )}
                    </div>
                    {s.notes && <p className="text-xs text-muted-foreground">{s.notes}</p>}
                    {s.workout_session_exercises && s.workout_session_exercises.length > 0 && (
                      <div className="mt-1 space-y-1 border-t pt-2">
                        {s.workout_session_exercises.map((ex) => (
                          <div key={ex.id} className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground/80">{ex.exercise_name}</span>
                            {ex.workout_sets && ex.workout_sets.length > 0 && (
                              <span className="ml-2">
                                {ex.workout_sets.map((set) =>
                                  `${set.reps ?? "-"}\u00D7${set.weight_kg ?? "-"}kg`
                                ).join(", ")}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
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

function WorkoutSessionForm({
  type,
  templates,
  onSaved,
}: {
  type: "strength" | "sport_session";
  templates: WorkoutTemplate[];
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [sport, setSport] = useState("");
  const [durationMin, setDurationMin] = useState("");
  const [rpe, setRpe] = useState("");
  const [intensity, setIntensity] = useState("");
  const [notes, setNotes] = useState("");
  const [exercises, setExercises] = useState<{ exerciseName: string; sets: { setNumber: number; reps: string; weightKg: string }[] }[]>([]);
  const [saving, setSaving] = useState(false);

  // Exercise search state for session logging
  const [exSearchIndex, setExSearchIndex] = useState<number | null>(null);
  const [exSearchResults, setExSearchResults] = useState<ExerciseSearchResult[]>([]);
  const [exSearching, setExSearching] = useState(false);

  const handleExSearch = async (query: string, index: number) => {
    setExSearchIndex(index);
    if (query.length < 2) {
      setExSearchResults([]);
      return;
    }
    setExSearching(true);
    const results = await searchExercises(query);
    setExSearchResults(results);
    setExSearching(false);
  };

  const selectExResult = (result: ExerciseSearchResult, index: number) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], exerciseName: result.name };
    setExercises(updated);
    setExSearchResults([]);
    setExSearchIndex(null);
  };

  const addExercise = () => {
    setExercises((prev) => [...prev, { exerciseName: "", sets: [{ setNumber: 1, reps: "", weightKg: "" }] }]);
  };

  const addSet = (exIndex: number) => {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIndex ? { ...ex, sets: [...ex.sets, { setNumber: ex.sets.length + 1, reps: "", weightKg: "" }] } : ex
      )
    );
  };

  const removeExercise = (exIndex: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== exIndex));
  };

  const loadTemplate = (templateId: string) => {
    const t = templates.find((t) => t.id === templateId);
    if (!t) return;
    setName(t.name);
    setSport(t.sport ?? "");
    setExercises(
      (t.workout_template_exercises ?? []).map((ex) => ({
        exerciseName: ex.exercise_name,
        sets: Array.from({ length: ex.default_sets ?? 3 }, (_, i) => ({
          setNumber: i + 1,
          reps: String(ex.default_reps ?? ""),
          weightKg: String(ex.default_weight_kg ?? ""),
        })),
      }))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await createWorkoutSession({
        name: name.trim(),
        type,
        sport: sport || undefined,
        durationMin: durationMin ? parseInt(durationMin) : undefined,
        rpe: rpe ? parseInt(rpe) : undefined,
        intensity: intensity || undefined,
        notes: notes || undefined,
        exercises: type === "strength"
          ? exercises.filter((ex) => ex.exerciseName.trim()).map((ex) => ({
              exerciseName: ex.exerciseName.trim(),
              sets: ex.sets.filter((s) => s.reps || s.weightKg).map((s) => ({
                setNumber: s.setNumber,
                reps: s.reps ? parseInt(s.reps) : undefined,
                weightKg: s.weightKg ? parseFloat(s.weightKg) : undefined,
              })),
            }))
          : undefined,
      });
      onSaved();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save");
    }
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {type === "strength" ? "Log Strength Workout" : "Log Sport Session"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Template selector for strength */}
          {type === "strength" && templates.length > 0 && (
            <label className="space-y-1">
              <span className="text-sm font-medium">Load from Template</span>
              <select
                onChange={(e) => e.target.value && loadTemplate(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="">-- Select a template --</option>
                {templates.filter((t) => t.type === "strength").map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </label>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-medium">Workout Name *</span>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder={type === "strength" ? "e.g. Upper Body Push" : "e.g. Soccer Practice"} required />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">Sport</span>
              <input type="text" value={sport} onChange={(e) => setSport(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="e.g. Soccer, Basketball" />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">Duration (min)</span>
              <input type="number" min="1" value={durationMin} onChange={(e) => setDurationMin(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="e.g. 60" />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">RPE (1-10)</span>
              <input type="number" min="1" max="10" value={rpe} onChange={(e) => setRpe(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="e.g. 7" />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">Intensity</span>
              <select value={intensity} onChange={(e) => setIntensity(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                <option value="">Select...</option>
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
                <option value="very high">Very High</option>
                <option value="competition">Competition</option>
              </select>
            </label>
          </div>

          {/* Exercises (strength workouts) */}
          {type === "strength" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Exercises</span>
                <Button type="button" variant="outline" size="sm" onClick={addExercise}>
                  <Plus className="h-3 w-3" /> Add Exercise
                </Button>
              </div>
              {exercises.map((ex, exI) => (
                <div key={exI} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-blue-500" />
                      <input
                        type="text"
                        placeholder="Search or type exercise..."
                        value={ex.exerciseName}
                        onChange={(e) => {
                          const updated = [...exercises];
                          updated[exI] = { ...updated[exI], exerciseName: e.target.value };
                          setExercises(updated);
                          handleExSearch(e.target.value, exI);
                        }}
                        onFocus={() => setExSearchIndex(exI)}
                        onBlur={() => setTimeout(() => { if (exSearchIndex === exI) { setExSearchIndex(null); setExSearchResults([]); } }, 200)}
                        className="w-full rounded-md border border-blue-200 bg-background pl-8 pr-3 py-1.5 text-sm focus:border-blue-400"
                      />
                      {exSearchIndex === exI && exSearchResults.length > 0 && (
                        <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-40 overflow-y-auto rounded-md border bg-background shadow-lg">
                          {exSearchResults.map((r, idx) => (
                            <button
                              key={`${r.providerExerciseId}-${idx}`}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => selectExResult(r, exI)}
                              className="flex w-full items-center justify-between p-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-blue-950 border-b last:border-b-0"
                            >
                              <span className="font-medium">{r.name}</span>
                              {r.category && <span className="text-xs text-muted-foreground">{r.category}</span>}
                            </button>
                          ))}
                        </div>
                      )}
                      {exSearchIndex === exI && exSearching && (
                        <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-md border bg-background p-2 shadow-lg">
                          <p className="flex items-center gap-2 text-xs text-muted-foreground">
                            <RefreshCw className="h-3 w-3 animate-spin" /> Searching...
                          </p>
                        </div>
                      )}
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeExercise(exI)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {ex.sets.map((set, setI) => (
                      <div key={setI} className="flex items-center gap-2 text-sm">
                        <span className="w-8 text-muted-foreground">#{set.setNumber}</span>
                        <input
                          type="number"
                          placeholder="Reps"
                          value={set.reps}
                          onChange={(e) => {
                            const updated = [...exercises];
                            updated[exI].sets[setI] = { ...updated[exI].sets[setI], reps: e.target.value };
                            setExercises(updated);
                          }}
                          className="w-20 rounded-md border bg-background px-2 py-1 text-sm"
                        />
                        <span className="text-muted-foreground">×</span>
                        <input
                          type="number"
                          step="0.5"
                          placeholder="Weight (kg)"
                          value={set.weightKg}
                          onChange={(e) => {
                            const updated = [...exercises];
                            updated[exI].sets[setI] = { ...updated[exI].sets[setI], weightKg: e.target.value };
                            setExercises(updated);
                          }}
                          className="w-28 rounded-md border bg-background px-2 py-1 text-sm"
                        />
                        <span className="text-muted-foreground text-xs">kg</span>
                      </div>
                    ))}
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => addSet(exI)}>
                    <Plus className="h-3 w-3" /> Add Set
                  </Button>
                </div>
              ))}
            </div>
          )}

          <label className="space-y-1">
            <span className="text-sm font-medium">Notes</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" rows={2} placeholder="How did the session go?" />
          </label>
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Workout"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function TemplateForm({ onSaved }: { onSaved: () => void }) {
  const [name, setName] = useState("");
  const [sport, setSport] = useState("");
  const [exercises, setExercises] = useState<{ exerciseName: string; defaultSets: string; defaultReps: string; defaultWeightKg: string; exerciseLibraryId?: string }[]>([
    { exerciseName: "", defaultSets: "3", defaultReps: "10", defaultWeightKg: "" },
  ]);
  const [saving, setSaving] = useState(false);

  // Exercise search state
  const [searchIndex, setSearchIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ExerciseSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const addExercise = () => {
    setExercises((prev) => [...prev, { exerciseName: "", defaultSets: "3", defaultReps: "10", defaultWeightKg: "" }]);
  };

  const handleExerciseSearch = async (query: string, index: number) => {
    setSearchQuery(query);
    setSearchIndex(index);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const results = await searchExercises(query);
    setSearchResults(results);
    setSearching(false);
  };

  const selectSearchResult = async (result: ExerciseSearchResult, index: number) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], exerciseName: result.name };
    setExercises(updated);
    setSearchResults([]);
    setSearchIndex(null);
    setSearchQuery("");

    // Save to exercise library for caching
    try {
      const saved = await saveExercise(result);
      const updated2 = [...exercises];
      updated2[index] = { ...updated2[index], exerciseName: result.name, exerciseLibraryId: saved.id };
      setExercises(updated2);
    } catch {
      // Non-critical; the exercise name is still set
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await createWorkoutTemplate({
        name: name.trim(),
        sport: sport || undefined,
        exercises: exercises.filter((ex) => ex.exerciseName.trim()).map((ex) => ({
          exerciseName: ex.exerciseName.trim(),
          defaultSets: ex.defaultSets ? parseInt(ex.defaultSets) : undefined,
          defaultReps: ex.defaultReps ? parseInt(ex.defaultReps) : undefined,
          defaultWeightKg: ex.defaultWeightKg ? parseFloat(ex.defaultWeightKg) : undefined,
          exerciseLibraryId: ex.exerciseLibraryId,
        })),
      });
      onSaved();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save");
    }
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Create Workout Template</CardTitle>
        <CardDescription>Save a reusable template — search exercises from the wger library</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-medium">Template Name *</span>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="e.g. Push Day" required />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">Sport (optional)</span>
              <input type="text" value={sport} onChange={(e) => setSport(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="e.g. General, Basketball" />
            </label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Exercises</span>
              <Button type="button" variant="outline" size="sm" onClick={addExercise}>
                <Plus className="h-3 w-3" /> Add
              </Button>
            </div>
            {exercises.map((ex, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-blue-500" />
                    <input
                      type="text"
                      placeholder="Search or type exercise name..."
                      value={searchIndex === i ? searchQuery : ex.exerciseName}
                      onChange={(e) => {
                        const updated = [...exercises];
                        updated[i] = { ...updated[i], exerciseName: e.target.value };
                        setExercises(updated);
                        handleExerciseSearch(e.target.value, i);
                      }}
                      onFocus={() => {
                        setSearchIndex(i);
                        setSearchQuery(ex.exerciseName);
                      }}
                      onBlur={() => {
                        // Delay to allow click on result
                        setTimeout(() => {
                          if (searchIndex === i) {
                            setSearchIndex(null);
                            setSearchResults([]);
                          }
                        }, 200);
                      }}
                      className="w-full rounded-md border border-blue-200 bg-background pl-8 pr-3 py-1.5 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-300"
                    />
                    {/* Search results dropdown */}
                    {searchIndex === i && searchResults.length > 0 && (
                      <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-md border bg-background shadow-lg">
                        {searchResults.map((r, idx) => (
                          <button
                            key={`${r.providerExerciseId}-${idx}`}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => selectSearchResult(r, i)}
                            className="flex w-full items-center justify-between p-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors border-b last:border-b-0"
                          >
                            <div>
                              <span className="font-medium">{r.name}</span>
                              {r.category && (
                                <Badge variant="training" className="ml-2 text-xs">{r.category}</Badge>
                              )}
                            </div>
                            {r.muscles.length > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {r.muscles.slice(0, 2).join(", ")}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                    {searchIndex === i && searching && (
                      <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-md border bg-background p-2 shadow-lg">
                        <p className="flex items-center gap-2 text-xs text-muted-foreground">
                          <RefreshCw className="h-3 w-3 animate-spin" /> Searching wger...
                        </p>
                      </div>
                    )}
                  </div>
                  <input
                    type="number"
                    placeholder="Sets"
                    value={ex.defaultSets}
                    onChange={(e) => {
                      const updated = [...exercises];
                      updated[i] = { ...updated[i], defaultSets: e.target.value };
                      setExercises(updated);
                    }}
                    className="w-16 rounded-md border bg-background px-2 py-1.5 text-sm"
                  />
                  <span className="text-xs text-muted-foreground">×</span>
                  <input
                    type="number"
                    placeholder="Reps"
                    value={ex.defaultReps}
                    onChange={(e) => {
                      const updated = [...exercises];
                      updated[i] = { ...updated[i], defaultReps: e.target.value };
                      setExercises(updated);
                    }}
                    className="w-16 rounded-md border bg-background px-2 py-1.5 text-sm"
                  />
                  <Button type="button" variant="ghost" size="sm" onClick={() => setExercises((prev) => prev.filter((_, j) => j !== i))}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                {ex.exerciseLibraryId && (
                  <span className="ml-9 text-xs text-blue-500">From exercise library</span>
                )}
              </div>
            ))}
          </div>

          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Template"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════
   FUELING TAB
   ═══════════════════════════════════════════════════════════ */

function FuelingTab({ athleteId, isPsychologist }: { athleteId: string | null; isPsychologist: boolean }) {
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const athleteParam = isPsychologist ? athleteId ?? undefined : undefined;

  const load = useCallback(async () => {
    if (!athleteId) return;
    setLoading(true);
    const data = await fetchMeals(undefined, undefined, athleteParam);
    setMeals(data);
    setLoading(false);
  }, [athleteId, athleteParam]);

  useEffect(() => { load(); }, [load]);

  // Compute daily macros for today
  const todayKey = new Date().toISOString().split("T")[0];
  const todayMeals = meals.filter((m) => m.logged_at.startsWith(todayKey));
  const todayTotals = todayMeals.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.calories ?? 0),
      protein: acc.protein + (m.protein_g ?? 0),
      carbs: acc.carbs + (m.carbs_g ?? 0),
      fat: acc.fat + (m.fat_g ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <div className="space-y-4">
      {/* Today's macros summary */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="border-orange-200 dark:border-orange-800">
          <CardContent className="py-4">
            <div className="flex items-center gap-1.5">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-xs font-medium text-muted-foreground">Calories In</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-orange-600 dark:text-orange-400">{Math.round(todayTotals.calories)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <span className="text-xs font-medium text-muted-foreground">Protein</span>
            <p className="mt-1 text-2xl font-bold">{Math.round(todayTotals.protein)}g</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <span className="text-xs font-medium text-muted-foreground">Carbs</span>
            <p className="mt-1 text-2xl font-bold">{Math.round(todayTotals.carbs)}g</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <span className="text-xs font-medium text-muted-foreground">Fat</span>
            <p className="mt-1 text-2xl font-bold">{Math.round(todayTotals.fat)}g</p>
          </CardContent>
        </Card>
      </div>

      {/* Log meal */}
      {!isPsychologist && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm((p) => !p)}>
            <Plus className="h-4 w-4" />
            {showForm ? "Cancel" : "Log Meal"}
          </Button>
        </div>
      )}

      {showForm && <MealForm onSaved={() => { setShowForm(false); load(); emitSaved(); }} />}

      {/* Meals list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Meals</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => <SkeletonPulse key={i} className="h-16 w-full" />)}
            </div>
          ) : meals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No meals logged yet. Search for foods to get started.</p>
          ) : (
            <div className="space-y-2">
              {meals.slice(0, 30).map((m) => (
                <div key={m.id} className="flex items-start justify-between rounded-lg border p-3 transition-colors hover:bg-muted/30">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{m.meal_name}</span>
                      {m.meal_type && <Badge variant="fueling" className="text-xs">{m.meal_type.replace("_", " ")}</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {m.calories != null && (
                        <span className="inline-flex items-center rounded-md bg-orange-500/10 px-2 py-0.5 text-xs font-medium text-orange-700 dark:text-orange-300">
                          {Math.round(m.calories)} cal
                        </span>
                      )}
                      {m.protein_g != null && (
                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          P: {Math.round(m.protein_g)}g
                        </span>
                      )}
                      {m.carbs_g != null && (
                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          C: {Math.round(m.carbs_g)}g
                        </span>
                      )}
                      {m.fat_g != null && (
                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          F: {Math.round(m.fat_g)}g
                        </span>
                      )}
                    </div>
                    {m.notes && <p className="text-xs text-muted-foreground">{m.notes}</p>}
                  </div>
                  <span className="ml-4 shrink-0 text-xs text-muted-foreground">
                    {new Date(m.logged_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MealForm({ onSaved }: { onSaved: () => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<EdamamFood[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState<EdamamFood | null>(null);

  // Manual / selected food fields
  const [mealName, setMealName] = useState("");
  const [mealType, setMealType] = useState("");
  const [calories, setCalories] = useState("");
  const [proteinG, setProteinG] = useState("");
  const [carbsG, setCarbsG] = useState("");
  const [fatG, setFatG] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const results = await searchEdamamFoods(searchQuery.trim());
    setSearchResults(results);
    setSearching(false);
  };

  const selectFood = (food: EdamamFood) => {
    setSelectedFood(food);
    setMealName(food.label);
    setCalories(food.nutrients.calories != null ? String(Math.round(food.nutrients.calories)) : "");
    setProteinG(food.nutrients.protein != null ? String(Math.round(food.nutrients.protein)) : "");
    setCarbsG(food.nutrients.carbs != null ? String(Math.round(food.nutrients.carbs)) : "");
    setFatG(food.nutrients.fat != null ? String(Math.round(food.nutrients.fat)) : "");
    setSearchResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealName.trim()) return;
    setSaving(true);
    try {
      await createMeal({
        mealName: mealName.trim(),
        mealType: mealType || undefined,
        calories: calories ? parseFloat(calories) : undefined,
        proteinG: proteinG ? parseFloat(proteinG) : undefined,
        carbsG: carbsG ? parseFloat(carbsG) : undefined,
        fatG: fatG ? parseFloat(fatG) : undefined,
        edamamFoodJson: selectedFood ?? undefined,
        notes: notes || undefined,
      });
      onSaved();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save");
    }
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Log Meal</CardTitle>
        <CardDescription>Search for foods using Edamam or enter manually</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Edamam Search */}
        <div className="mb-4 space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
                className="w-full rounded-md border bg-background pl-9 pr-3 py-2 text-sm"
                placeholder="Search foods (e.g. chicken breast, banana)..."
              />
            </div>
            <Button type="button" variant="outline" onClick={handleSearch} disabled={searching}>
              {searching ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="max-h-60 overflow-y-auto rounded-md border">
              {searchResults.map((food, i) => (
                <button
                  key={`${food.foodId}-${i}`}
                  type="button"
                  onClick={() => selectFood(food)}
                  className="flex w-full items-center justify-between p-2 text-left text-sm hover:bg-accent/50 transition-colors border-b last:border-b-0"
                >
                  <div>
                    <span className="font-medium">{food.label}</span>
                    {food.brand && <span className="ml-1 text-muted-foreground">({food.brand})</span>}
                  </div>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    {food.nutrients.calories != null && <span>{Math.round(food.nutrients.calories)} cal</span>}
                    {food.nutrients.protein != null && <span>P:{Math.round(food.nutrients.protein)}g</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Meal form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-medium">Meal Name *</span>
              <input type="text" value={mealName} onChange={(e) => setMealName(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="e.g. Grilled Chicken Salad" required />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">Meal Type</span>
              <select value={mealType} onChange={(e) => setMealType(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                <option value="">Select...</option>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
                <option value="pre_workout">Pre-Workout</option>
                <option value="post_workout">Post-Workout</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">Calories</span>
              <input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="e.g. 450" />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">Protein (g)</span>
              <input type="number" value={proteinG} onChange={(e) => setProteinG(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="e.g. 35" />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">Carbs (g)</span>
              <input type="number" value={carbsG} onChange={(e) => setCarbsG(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="e.g. 40" />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">Fat (g)</span>
              <input type="number" value={fatG} onChange={(e) => setFatG(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" placeholder="e.g. 15" />
            </label>
          </div>
          <label className="space-y-1">
            <span className="text-sm font-medium">Notes</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm" rows={2} placeholder="Any additional notes..." />
          </label>
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Meal"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
