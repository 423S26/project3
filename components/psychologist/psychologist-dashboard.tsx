"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toLocalDateKey, todayDateKey } from "@/lib/psych-checkins";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Users,
  AlertTriangle,
  ClipboardList,
  ExternalLink,
  Smile,
  Zap,
  Target,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import { EMOJI_SCALE } from "@/lib/emoji-scale";

interface CaseloadCheckIn {
  id: string;
  athleteId: string;
  athleteName: string;
  athleteEmail: string;
  mood: number;
  stress: number;
  motivation: number;
  notes?: string;
  createdAt: string;
}

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

export function PsychologistDashboard() {
  const router = useRouter();
  const [recentCheckIns, setRecentCheckIns] = useState<CaseloadCheckIn[]>([]);
  const [caseload, setCaseload] = useState<CaseloadAthlete[]>([]);
  const [last7CheckIns, setLast7CheckIns] = useState<CaseloadCheckIn[]>([]);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/assignments");
      if (res.ok) {
        const data = await res.json();
        setCaseload(data.caseload ?? []);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const load = async () => {
      const now = new Date();
      const from = new Date(now);
      from.setDate(from.getDate() - 7);
      const params = new URLSearchParams({
        from: toLocalDateKey(from),
        to: toLocalDateKey(now),
      });
      const res = await fetch(`/api/psychologist/checkins?${params.toString()}`);
      if (res.ok) {
        setLast7CheckIns(await res.json());
      }
    };
    load();
  }, []);

  useEffect(() => {
    const load = async () => {
      const params = new URLSearchParams({ limit: "10", order: "desc" });
      const res = await fetch(`/api/psychologist/checkins?${params.toString()}`);
      if (res.ok) setRecentCheckIns(await res.json());
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const needsAttention = last7CheckIns.filter(
      (ci) => ci.mood <= 3 || ci.stress >= 8
    );
    const uniqueAthletes = new Set(needsAttention.map((ci) => ci.athleteId));
    const avgMood =
      last7CheckIns.length > 0
        ? last7CheckIns.reduce((sum, ci) => sum + ci.mood, 0) / last7CheckIns.length
        : 0;
    return {
      athleteCount: caseload.length,
      checkInsThisWeek: last7CheckIns.length,
      needsAttentionCount: uniqueAthletes.size,
      needsAttentionAthletes: [...uniqueAthletes],
      avgMood: avgMood.toFixed(1),
    };
  }, [caseload, last7CheckIns]);

  const needsAttentionList = useMemo(() => {
    const latest = new Map<string, CaseloadCheckIn>();
    for (const ci of last7CheckIns) {
      const existing = latest.get(ci.athleteId);
      if (!existing || new Date(ci.createdAt) > new Date(existing.createdAt)) {
        latest.set(ci.athleteId, ci);
      }
    }
    return [...latest.values()].filter(
      (ci) => ci.mood <= 3 || ci.stress >= 8
    );
  }, [last7CheckIns]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your athletes and their wellbeing
          </p>
        </div>
        <Link href="/help" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          <HelpCircle className="h-4 w-4" />
          Help?
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-blue-100 p-2.5 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.athleteCount}</p>
              <p className="text-xs text-muted-foreground">Athletes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-green-100 p-2.5 text-green-600">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.checkInsThisWeek}</p>
              <p className="text-xs text-muted-foreground">Check-Ins (Last 7 Days)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className={`rounded-lg p-2.5 ${stats.needsAttentionCount > 0 ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500"}`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.needsAttentionCount}</p>
              <p className="text-xs text-muted-foreground">Need Attention (Low Mood / High Stress)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Needs Attention */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Needs Attention
            </CardTitle>
            <CardDescription>
              Athletes with low mood or high stress in the last 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {needsAttentionList.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                All athletes are in good shape. No concerns flagged.
              </p>
            ) : (
              <div className="space-y-3">
                {needsAttentionList.map((ci) => (
                  <button
                    key={ci.athleteId}
                    onClick={() => router.push(`/psychologist/athletes/${ci.athleteId}`)}
                    className="w-full rounded-lg border border-red-200 bg-red-50 p-3 text-left transition-colors hover:bg-red-100 dark:border-red-900 dark:bg-red-950/30 dark:hover:bg-red-950/50"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-medium">{ci.athleteName}</span>
                      <span className="text-xs text-muted-foreground">
                        {timeAgo(ci.createdAt)}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Smile className="h-3.5 w-3.5 text-violet-500" />
                        <span>Mood: {ci.mood}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="h-3.5 w-3.5 text-amber-500" />
                        <span>Stress: {ci.stress}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="h-3.5 w-3.5 text-green-500" />
                        <span>Motivation: {ci.motivation}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Check-Ins */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Recent Check-Ins
            </CardTitle>
            <CardDescription>Latest check-ins across your caseload</CardDescription>
          </CardHeader>
          <CardContent>
            {recentCheckIns.length === 0 ? (
              <p className="text-sm text-muted-foreground">No check-ins yet.</p>
            ) : (
              <div className="space-y-3">
                {recentCheckIns.map((ci) => (
                  <button
                    key={ci.id}
                    onClick={() =>
                      router.push(
                        `/psychologist/athletes/${ci.athleteId}?date=${toLocalDateKey(new Date(ci.createdAt))}&checkInId=${ci.id}`
                      )
                    }
                    className="w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent/50"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-medium">{ci.athleteName}</span>
                      <span className="text-xs text-muted-foreground">
                        {timeAgo(ci.createdAt)}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Smile className="h-3.5 w-3.5 text-violet-500" />
                        <span>{ci.mood} {EMOJI_SCALE[ci.mood]}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="h-3.5 w-3.5 text-amber-500" />
                        <span>{ci.stress} {EMOJI_SCALE[ci.stress]}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="h-3.5 w-3.5 text-green-500" />
                        <span>{ci.motivation} {EMOJI_SCALE[ci.motivation]}</span>
                      </div>
                    </div>
                    {ci.notes && (
                      <p className="mt-1 truncate text-xs text-muted-foreground">{ci.notes}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Athlete Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Athlete Overview
              </CardTitle>
              <CardDescription>
                {caseload.length} athlete{caseload.length !== 1 ? "s" : ""} assigned to you
              </CardDescription>
            </div>
            <Link
              href="/psychologist/athletes"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1")}
            >
              Manage Athletes
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {caseload.length === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
              No athletes assigned yet.{" "}
              <Link href="/psychologist/athletes" className="font-medium underline">
                Add your first athlete
              </Link>{" "}
              to get started.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {caseload.map((a) => {
                const profile = a.athlete.athlete_profiles?.[0];
                return (
                  <div
                    key={a.athleteId}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{a.athlete.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{a.athlete.email}</p>
                      {profile?.sport && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {profile.sport}
                          {profile.team ? ` · ${profile.team}` : ""}
                        </Badge>
                      )}
                    </div>
                    <button
                      onClick={() =>
                        router.push(`/psychologist/athletes/${a.athleteId}`)
                      }
                      className="ml-2 rounded-md p-2 hover:bg-accent"
                      title="Open athlete details"
                    >
                      <ExternalLink className="h-4 w-4" />
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

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
