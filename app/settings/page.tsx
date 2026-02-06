import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Moon, User, Bell, Shield, Download, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
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
              <CardDescription>Set recovery and check-in goals</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Personal Goals</p>
                <p className="text-sm text-muted-foreground">
                  Set targets for check-in frequency, recovery, and training
                </p>
              </div>
              <Button variant="outline" disabled>
                Coming in Sprint 6
              </Button>
            </div>
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
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Dark Mode</p>
                <p className="text-sm text-muted-foreground">
                  Toggle dark theme for the app
                </p>
              </div>
              <Button variant="outline" disabled>
                Coming in Sprint 6
              </Button>
            </div>
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
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Account Settings</p>
                <p className="text-sm text-muted-foreground">
                  Update your profile and practitioner connection
                </p>
              </div>
              <Button variant="outline" disabled>
                Coming Soon
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="rounded-lg bg-amber-100 p-2 text-amber-600">
              <Bell className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">Notifications</CardTitle>
              <CardDescription>Configure alerts and reminders</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Reminders</p>
                <p className="text-sm text-muted-foreground">
                  Get reminders for sessions, check-ins, and assessments
                </p>
              </div>
              <Button variant="outline" disabled>
                Coming Soon
              </Button>
            </div>
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
