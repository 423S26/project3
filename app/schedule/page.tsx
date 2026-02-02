import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Briefcase, GraduationCap } from "lucide-react";

export default function SchedulePage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
        <p className="text-muted-foreground">
          Manage your work shifts and class schedule
        </p>
      </div>

      {/* Placeholder Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
              <Briefcase className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg">Work Shifts</CardTitle>
              <CardDescription>Track your work schedule</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Coming in Sprint 2: Add and manage work shifts, view weekly hours,
              and sync with your calendar.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="rounded-lg bg-purple-100 p-2 text-purple-600">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg">Classes</CardTitle>
              <CardDescription>Manage your class schedule</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Coming in Sprint 2: Add courses, track assignments, and view your
              weekly class schedule.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Overview Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Weekly Overview
          </CardTitle>
          <CardDescription>
            Your combined work and school schedule
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed">
            <p className="text-muted-foreground">
              Weekly calendar view coming in Sprint 2
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
