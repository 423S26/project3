import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Dumbbell, Utensils, TrendingUp } from "lucide-react";

export default function HealthPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Health</h1>
        <p className="text-muted-foreground">
          Track your workouts, meals, and overall health progress
        </p>
      </div>

      {/* Quick Stats Placeholder */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0 workouts</div>
            <p className="text-xs text-muted-foreground">
              Start logging in Sprint 2
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Calories</CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-- / 2000</div>
            <p className="text-xs text-muted-foreground">
              Meal tracking in Sprint 2
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Weight tracking in Sprint 2
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Feature Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="rounded-lg bg-green-100 p-2 text-green-600">
              <Dumbbell className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg">Workouts</CardTitle>
              <CardDescription>Plan and log your exercises</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Coming in Sprint 2: Create workout plans, log exercises, track
              sets/reps, and view your progress over time.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="rounded-lg bg-orange-100 p-2 text-orange-600">
              <Utensils className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg">Meals & Nutrition</CardTitle>
              <CardDescription>Track what you eat</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Coming in Sprint 2: Log meals, track macros, view nutrition info,
              and monitor your daily food spending.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Health Overview
          </CardTitle>
          <CardDescription>
            Track your fitness journey over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed">
            <p className="text-muted-foreground">
              Progress charts coming in Sprint 2
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
