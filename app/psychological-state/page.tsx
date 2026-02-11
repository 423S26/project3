import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, TrendingUp } from "lucide-react";
import { PsychologicalStateSection } from "@/components/psych/psychological-state-section";
import { PsychologicalStateStats } from "@/components/psych/psychological-state-stats";

interface PageProps {
  searchParams: Promise<{ date?: string; checkInId?: string }>;
}

export default async function PsychologicalStatePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const initialDateKey = params.date ?? undefined;
  const initialFocusCheckInId = params.checkInId ?? undefined;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Psychological State</h1>
        <p className="text-muted-foreground">
          Track your mood, stress, motivation, and mental readiness
        </p>
      </div>

      {/* Quick Stats - show latest check-in when available */}
      <PsychologicalStateStats />

      {/* Check-In Form + Day History + Latest Saved */}
      <PsychologicalStateSection
        initialDateKey={initialDateKey}
        initialFocusCheckInId={initialFocusCheckInId}
      />

      {/* Feature Cards */}
      <div className="grid gap-4 md:grid-cols-2">
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
                Trend charts coming in Sprint 5
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
