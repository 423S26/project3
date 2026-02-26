/**
 * Route: /help
 * User-facing documentation explaining what Anchor is, who it's for,
 * and how to use each feature.
 */

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Anchor,
  Brain,
  Activity,
  CalendarDays,
  MessageSquare,
  ClipboardList,
  Users,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Anchor className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Help & Documentation</h1>
            <p className="text-muted-foreground">Everything you need to know about using Anchor</p>
          </div>
        </div>
        <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      {/* What is Anchor */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">What is Anchor?</h2>
        <p className="leading-relaxed text-muted-foreground">
          Anchor is a mental and physical wellbeing tracking platform built for sports psychologists
          and their athletes. It brings psychological state, physical recovery, training load, and
          practitioner sessions together in one calendar-driven view so that both athletes and their
          psychologists always have the full picture.
        </p>
        <p className="leading-relaxed text-muted-foreground">
          There are two roles in Anchor — <strong className="text-foreground">Athlete</strong> and{" "}
          <strong className="text-foreground">Psychologist</strong> — each with its own tailored
          experience.
        </p>
      </section>

      {/* Roles */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-5 w-5 text-primary" />
              Athlete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Log daily check-ins (Mood, Stress, Motivation on a 1–10 scale with emoji indicators) and optional free-text notes.</p>
            <p>View all your check-ins on a color-coded calendar and in the Today panel.</p>
            <p>Complete optional BRUMS-inspired expanded mood assessments.</p>
            <p>Your data is private — only you and your assigned psychologist can see it.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-primary" />
              Psychologist
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Browse and select from your assigned caseload of athletes using the sidebar.</p>
            <p>Review any athlete's mood, stress, and motivation history on a shared calendar view.</p>
            <p>Quick-stat cards surface athletes who may need attention (low mood or high stress).</p>
            <p>Click any calendar event to drill into a specific athlete's check-in details.</p>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">The Dashboard</h2>
        <p className="text-muted-foreground">
          The Dashboard is your home base. It shows a calendar of all recorded activity and a Today
          panel with a summary of what's logged for the current day.
        </p>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="font-medium">Calendar</p>
              <p className="text-sm text-muted-foreground">
                Toggle between Month and Week views using the buttons in the top-right of the
                calendar. Use the arrow buttons to navigate between time periods, or click
                &ldquo;Today&rdquo; to jump back to the current date.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
              <span className="h-3 w-3 rounded-full bg-violet-500" />
            </div>
            <div>
              <p className="font-medium">Filters</p>
              <p className="text-sm text-muted-foreground">
                Use the filter chips below the calendar header to show or hide event categories:
                Training (blue), Recovery (green), Mood (violet), Fueling (orange), and Assessments
                (teal). Turning off Mood also hides the Latest Check-In card.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Brain className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="font-medium">Latest Check-In card</p>
              <p className="text-sm text-muted-foreground">
                When the Mood filter is on, a summary card shows your most recent Mood, Stress, and
                Motivation ratings alongside the timestamp. It updates automatically after each
                new check-in.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Features</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-lg border p-3">
            <Brain className="mt-0.5 h-5 w-5 shrink-0 text-violet-500" />
            <div>
              <p className="font-medium text-sm">Psychological State</p>
              <p className="text-xs text-muted-foreground">
                Log a daily check-in (Mood, Stress, Motivation 1–10) with optional notes.
                An optional BRUMS-inspired extended assessment is also available.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border p-3">
            <Activity className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
            <div>
              <p className="font-medium text-sm">Physical State</p>
              <p className="text-xs text-muted-foreground">
                Log training load, recovery, and fueling data to track physical readiness
                alongside your psychological wellbeing.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border p-3">
            <MessageSquare className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
            <div>
              <p className="font-medium text-sm">Sessions</p>
              <p className="text-xs text-muted-foreground">
                Schedule and document practitioner sessions. Session history appears alongside
                your wellbeing data on the calendar.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border p-3">
            <ClipboardList className="mt-0.5 h-5 w-5 shrink-0 text-teal-500" />
            <div>
              <p className="font-medium text-sm">Assessments</p>
              <p className="text-xs text-muted-foreground">
                Periodic wellbeing assessments with due dates and reminders. Results are
                tracked longitudinally so you can see trends over time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy */}
      <Card className="border-muted bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Privacy & Safety
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            All data in Anchor is self-reported and intended to support reflection and
            practitioner-guided discussion. Anchor does <strong className="text-foreground">not</strong>{" "}
            provide medical or psychological diagnosis or treatment. Your data is protected
            by Row-Level Security — each athlete&apos;s records are only visible to themselves
            and their assigned psychologist.
          </p>
        </CardContent>
      </Card>

      {/* Back button */}
      <div className="pb-4">
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
