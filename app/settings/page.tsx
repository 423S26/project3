import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Moon, User, Bell, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Customize your Anchor experience
        </p>
      </div>

      {/* Settings Sections */}
      <div className="grid gap-4">
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
                Coming Soon
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
                  Update your profile and preferences
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
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Get reminders for bills, workouts, and meals
                </p>
              </div>
              <Button variant="outline" disabled>
                Coming Soon
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="rounded-lg bg-green-100 p-2 text-green-600">
              <Shield className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">Privacy & Security</CardTitle>
              <CardDescription>Manage your data and security</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Data Export</p>
                <p className="text-sm text-muted-foreground">
                  Export your health and finance data
                </p>
              </div>
              <Button variant="outline" disabled>
                Coming Soon
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Version Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            About
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong>Anchor</strong> - Health & Finance Dashboard</p>
            <p>Version: 0.1.0 (Sprint 1)</p>
            <p>ESOF 423 - Spring 2026</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
