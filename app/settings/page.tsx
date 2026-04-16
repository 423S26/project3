/**
 * Route: /settings
 * Application settings and preferences page (goals, appearance, profile, privacy).
 * Currently displays placeholder content; most settings features coming in Sprint 6.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Moon, User, Shield, Download, Target, MessageSquarePlus, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAuthUser } from "@/lib/supabase/server";
import { AthleteProfileEditor } from "@/components/settings/athlete-profile-editor";
import { DarkModeToggle } from "@/components/settings/dark-mode-toggle";
import { AthleteGoalsEditor } from "@/components/settings/athlete-goals-editor";
import { PsychologistProfileEditor } from "@/components/settings/psychologist-profile-editor";
import { PsychologistGoalsViewer } from "@/components/settings/psychologist-goals-viewer";

export default async function SettingsPage() {
  const user = await getAuthUser();
  const isPsychologist = user?.role === "PSYCHOLOGIST";
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Customize your Anchor experience and manage your data
        </p>
      </div>

      {/* Settings Sections */}
      <div className="grid gap-4">
        {/* Goals */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="rounded-lg bg-violet-100 p-2 text-violet-600">
              <Target className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">Goals & Preferences</CardTitle>
              <CardDescription>
                {isPsychologist ? "View your athletes' goals" : "Set recovery and check-in goals"}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {!isPsychologist ? (
              <AthleteGoalsEditor />
            ) : (
              <PsychologistGoalsViewer />
            )}
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
              <Moon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">Appearance</CardTitle>
              <CardDescription>Customize how Anchor looks</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <DarkModeToggle />
          </CardContent>
        </Card>

        {/* Profile */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
              <User className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">Profile</CardTitle>
              <CardDescription>Manage your account details</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isPsychologist && <AthleteProfileEditor />}
            {isPsychologist && <PsychologistProfileEditor />}
          </CardContent>
        </Card>

        {/* Feedback */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="rounded-lg bg-teal-100 p-2 text-teal-600">
              <MessageSquarePlus className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">Feedback</CardTitle>
              <CardDescription>
                Help the team spot sticking points, unclear interfaces, and missing documentation
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Submit Feedback</p>
                <p className="text-sm text-muted-foreground">
                  Report something confusing, broken, or missing
                </p>
              </div>
              <a
                href="/feedback?from=/settings"
                className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <ExternalLink className="h-4 w-4" />
                Open Form
              </a>
            </div>
            {isPsychologist && (
              <div className="flex items-center justify-between border-t pt-3">
                <div>
                  <p className="font-medium">Feedback Reports</p>
                  <p className="text-sm text-muted-foreground">
                    Review all user-submitted feedback
                  </p>
                </div>
                <a
                  href="/psychologist/feedback"
                  className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Reports
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Privacy & Data */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="rounded-lg bg-green-100 p-2 text-green-600">
              <Shield className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">Privacy & Data</CardTitle>
              <CardDescription>Control your data and privacy settings</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Data Export</p>
                <p className="text-sm text-muted-foreground">
                  Export your wellbeing data for practitioner review
                </p>
              </div>
              <Button variant="outline" disabled>
                <Download className="mr-2 h-4 w-4" />
                Coming in Sprint 6
              </Button>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-800">
                <strong>Privacy Notice:</strong> All data in Anchor is self-reported and 
                client-owned. You control who can view your information and can export 
                or delete it at any time.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Version Info + Ethics Notice */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            About Anchor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong>Anchor</strong> - Sports Psychology Client App</p>
            <p>A mental and physical wellbeing tracking platform for sports psychologists and their clients.</p>
            <p>Version: 0.1.0 (Sprint 1)</p>
            <p>ESOF 423 - Spring 2026</p>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              <strong>Important:</strong> Anchor does not provide medical or psychological 
              diagnosis or treatment. All data is self-reported and intended to support 
              reflection and practitioner-guided discussion.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
