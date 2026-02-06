import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Calendar, Video, FileText } from "lucide-react";

export default function SessionsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sessions</h1>
        <p className="text-muted-foreground">
          Schedule, manage, and review practitioner sessions
        </p>
      </div>

      {/* Placeholder Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg">Upcoming Sessions</CardTitle>
              <CardDescription>View scheduled appointments</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Coming in Sprint 3: Schedule sessions with your practitioner,
              receive reminders, and view upcoming appointments.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="rounded-lg bg-purple-100 p-2 text-purple-600">
              <Video className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg">Session Types</CardTitle>
              <CardDescription>In-person and virtual options</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Coming in Sprint 3: Choose between in-person and virtual sessions
              based on your preferences and availability.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Session History Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Session History
          </CardTitle>
          <CardDescription>
            Review past sessions and practitioner notes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed">
            <div className="text-center">
              <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-muted-foreground">
                Session history coming in Sprint 3
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
