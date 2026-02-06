/**
 * Route: /psychological-state
 * Mental wellbeing tracking page for mood, stress, motivation, and readiness.
 * Currently displays placeholder content; check-ins coming in Sprint 2, trends in Sprint 5.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Smile, TrendingUp, Zap, Target } from "lucide-react";

export default function PsychologicalStatePage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Psychological State</h1>
        <p className="text-muted-foreground">
          Track your mood, stress, motivation, and mental readiness
        </p>
      </div>

      {/* Quick Stats Placeholder */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Mood</CardTitle>
            <Smile className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Check-in available in Sprint 2
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Stress Level</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Tracking in Sprint 2
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Motivation</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Tracking in Sprint 2
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Feature Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="rounded-lg bg-violet-100 p-2 text-violet-600">
              <Smile className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg">Daily Check-In</CardTitle>
              <CardDescription>Log your psychological state</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Coming in Sprint 2: Complete daily check-ins for mood, stress,
              and motivation. Track patterns over time.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="rounded-lg bg-pink-100 p-2 text-pink-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg">Wellbeing Trends</CardTitle>
              <CardDescription>Visualize your mental state over time</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Coming in Sprint 5: View trends in mood, stress, and motivation
              alongside physical recovery data.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trends Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Psychological Overview
          </CardTitle>
          <CardDescription>
            Insights into your emotional readiness and mental load
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed">
            <div className="text-center">
              <Brain className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-muted-foreground">
                Psychological state tracking coming in Sprint 2
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
