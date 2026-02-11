/**
 * Route: /physical-state
 * Physical wellbeing tracking page for recovery, training load, and fueling.
 * Currently displays placeholder content; recovery/training in Sprint 4, fueling in Sprint 5.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Battery, Dumbbell, Utensils, Moon, TrendingUp } from "lucide-react";

export default function PhysicalStatePage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Physical State</h1>
        <p className="text-muted-foreground">
          Track your recovery, training load, and fueling
        </p>
      </div>

      {/* Quick Stats Placeholder */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recovery Status</CardTitle>
            <Battery className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Logging in Sprint 4
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Training Load</CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Tracking in Sprint 4
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Fueling Status</CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Tracking in Sprint 5
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Section: Recovery */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="rounded-lg bg-green-100 p-2 text-green-600">
            <Battery className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-lg">Recovery</CardTitle>
            <CardDescription>Track fatigue, soreness, and sleep quality</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Coming in Sprint 4: Log daily recovery metrics including fatigue levels,
            muscle soreness, and sleep quality to optimize your training schedule.
          </p>
        </CardContent>
      </Card>

      {/* Section: Training Load */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
            <Dumbbell className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-lg">Training Load</CardTitle>
            <CardDescription>Monitor training intensity and volume</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Coming in Sprint 4: Track training sessions, intensity levels, and
            cumulative load to prevent overtraining and optimize performance.
          </p>
        </CardContent>
      </Card>

      {/* Section: Fueling */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="rounded-lg bg-orange-100 p-2 text-orange-600">
            <Utensils className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-lg">Fueling</CardTitle>
            <CardDescription>Log meals and nutrition timing</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Coming in Sprint 5: Track fueling events, meal timing, and nutrition
            notes to support recovery and performance.
          </p>
        </CardContent>
      </Card>

      {/* Overview Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Physical State Overview
          </CardTitle>
          <CardDescription>
            Combined view of recovery, training, and fueling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed">
            <div className="text-center">
              <TrendingUp className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-muted-foreground">
                Physical state tracking coming in Sprint 4
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
