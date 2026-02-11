/**
 * Route: /assessments
 * Wellbeing assessment page for completing structured questionnaires and tracking scores.
 * Currently displays placeholder content; assessment templates coming in Sprint 3.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Calendar, CheckCircle, Clock, FileText } from "lucide-react";

export default function AssessmentsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assessments</h1>
        <p className="text-muted-foreground">
          Complete wellbeing assessments and track your progress
        </p>
      </div>

      {/* Quick Stats Placeholder */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Due Soon</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Assessments in Sprint 3
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Next Due</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Scheduling in Sprint 3
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Feature Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="rounded-lg bg-teal-100 p-2 text-teal-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg">Weekly Wellbeing</CardTitle>
              <CardDescription>Regular check on overall state</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Coming in Sprint 3: Complete weekly wellbeing assessments to track
              your overall mental and physical state over time.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="rounded-lg bg-amber-100 p-2 text-amber-600">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg">Readiness Score</CardTitle>
              <CardDescription>Pre-competition readiness check</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Coming in Sprint 3: Assess your readiness before important events
              or competitions with structured questionnaires.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Assessment List Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Assessment History
          </CardTitle>
          <CardDescription>
            View completed assessments and track trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed">
            <div className="text-center">
              <ClipboardList className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-muted-foreground">
                Assessment templates coming in Sprint 3
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
