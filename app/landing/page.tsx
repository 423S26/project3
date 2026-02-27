/**
 * Route: /landing (Public Marketing Page)
 *
 * A public-facing landing page for the Anchor sports psychology platform.
 * Accessible without authentication. No app shell / sidebar rendered
 * (AppShell is bypassed via the /landing allowlist in app-shell.tsx).
 */

import Link from "next/link";
import { Anchor, Brain, Activity, BarChart2, ClipboardList, Users, ChevronRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/* -------------------------------------------------------------------------- */
/*  Static data                                                                */
/* -------------------------------------------------------------------------- */

const features = [
  {
    icon: <Brain className="h-7 w-7 text-primary" />,
    title: "Psychologist-Guided Training",
    description:
      "Work directly with a certified sports psychologist who monitors your mental and physical wellbeing every step of the way.",
  },
  {
    icon: <Activity className="h-7 w-7 text-primary" />,
    title: "Physical & Psychological Tracking",
    description:
      "Log your mood, energy, stress, and physical state in one place so your psychologist always has the full picture.",
  },
  {
    icon: <BarChart2 className="h-7 w-7 text-primary" />,
    title: "Data-Driven Performance Insights",
    description:
      "Turn daily check-ins into trends your psychologist can act on—spot burnout early, capitalise on peak form.",
  },
  {
    icon: <ClipboardList className="h-7 w-7 text-primary" />,
    title: "Structured Assessments",
    description:
      "Science-backed questionnaires (BRUMS and more) that give you and your psychologist a standardised baseline.",
  },
  {
    icon: <Users className="h-7 w-7 text-primary" />,
    title: "Athlete & Psychologist Collaboration",
    description:
      "Athletes and their psychologists share a single platform—no more spreadsheets or back-and-forth emails.",
  },
  {
    icon: <CheckCircle2 className="h-7 w-7 text-primary" />,
    title: "Stay Consistent",
    description:
      "Scheduled check-ins, session notes, and calendar-synced assignments keep you on track between sessions.",
  },
];

const steps = [
  {
    number: "01",
    title: "Create your account",
    description:
      "Sign up as an athlete or sports psychologist in under a minute.",
  },
  {
    number: "02",
    title: "Connect with your psychologist",
    description:
      "Your psychologist links you to their caseload and tailors your tracking programme.",
  },
  {
    number: "03",
    title: "Track, reflect, and perform",
    description:
      "Daily check-ins, assessments, and session notes feed into personalised insights that drive real results.",
  },
];

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ------------------------------------------------------------------ */}
      {/* Top bar                                                             */}
      {/* ------------------------------------------------------------------ */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/landing" className="flex items-center gap-2 font-semibold text-lg">
            <Anchor className="h-6 w-6 text-primary" />
            <span>Anchor</span>
          </Link>

          {/* Nav actions */}
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="outline" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Hero                                                                */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative overflow-hidden border-b">
        {/* Subtle gradient backdrop */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-background to-background"
        />

        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40 text-center">
          {/* Badge pill */}
          <span className="mb-6 inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-sm font-medium text-primary">
            Sports psychology + performance tracking
          </span>

          {/* Headline / catch phrase */}
          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Optimize your athletic abilities—{" "}
            <span className="text-primary">guided by a sports psychologist.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Track what matters, stay consistent, and perform when it counts.
            Anchor connects athletes with their sports psychologists on one
            platform built for the mental and physical demands of elite sport.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="gap-2 px-8">
                Start for free
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="px-8">
                Sign in to your account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Feature cards                                                       */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-b py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to reach your peak
            </h2>
            <p className="mt-4 text-muted-foreground">
              Anchor brings together the tools athletes and sports psychologists
              need—in one seamless platform.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* How it works                                                        */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-b py-20 sm:py-28 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-muted-foreground">
              Get started in three simple steps.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="flex flex-col items-center text-center">
                <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                  {step.number}
                </span>
                <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Dual CTA                                                            */}
      {/* ------------------------------------------------------------------ */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Athletes */}
            <div className="flex flex-col items-start justify-between rounded-2xl border bg-card p-8 shadow-sm">
              <div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">I&apos;m an Athlete</h3>
                <p className="mt-3 text-muted-foreground">
                  Track your psychological and physical state, complete
                  assessments, and stay aligned with your psychologist between
                  sessions.
                </p>
              </div>
              <Link href="/register" className="mt-8">
                <Button size="lg" className="gap-2">
                  Sign up as an athlete
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Psychologists */}
            <div className="flex flex-col items-start justify-between rounded-2xl border bg-card p-8 shadow-sm">
              <div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">I&apos;m a Sports Psychologist</h3>
                <p className="mt-3 text-muted-foreground">
                  Monitor your full caseload in one dashboard—view daily
                  check-ins, assessment results, and provide structured feedback
                  to every athlete you work with.
                </p>
              </div>
              <Link href="/register" className="mt-8">
                <Button size="lg" variant="outline" className="gap-2">
                  Sign up as a psychologist
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Footer                                                              */}
      {/* ------------------------------------------------------------------ */}
      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Anchor className="h-4 w-4 text-primary" />
            <span>Anchor</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Anchor. Sports psychology performance tracking.
          </p>
          <div className="flex gap-4 text-sm">
            <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
              Log in
            </Link>
            <Link href="/register" className="text-muted-foreground hover:text-foreground transition-colors">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
