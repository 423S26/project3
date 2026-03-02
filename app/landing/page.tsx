/**
 * Route: /landing (Public Marketing Page)
 *
 * A public-facing landing page for the Anchor sports psychology platform.
 * Accessible without authentication. No app shell / sidebar rendered
 * (AppShell is bypassed via the /landing allowlist in app-shell.tsx).
 */

import Link from "next/link";
import type { Metadata } from "next";
import {
  Anchor,
  Brain,
  Activity,
  BarChart2,
  ClipboardList,
  Users,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/* -------------------------------------------------------------------------- */
/*  Metadata                                                                   */
/* -------------------------------------------------------------------------- */

export const metadata: Metadata = {
  title: "Anchor — Sports Psychology & Performance Tracking",
  description:
    "Track what matters, stay consistent, and perform when it counts. Anchor connects athletes with their sports psychologists on one platform.",
};

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
    <div className="min-h-screen bg-background text-foreground scroll-smooth">
      {/* ------------------------------------------------------------------ */}
      {/* Top bar                                                             */}
      {/* ------------------------------------------------------------------ */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/landing"
            className="flex items-center gap-2 font-semibold text-lg tracking-tight transition-opacity hover:opacity-80"
          >
            <Anchor className="h-6 w-6 text-primary" />
            <span>Anchor</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
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
      <section id="hero" className="relative isolate overflow-hidden border-b">
        {/* Layered gradient backdrop */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_60%,hsl(var(--primary)/0.12),transparent)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-primary/[0.07] blur-3xl"
        />

        <div className="mx-auto max-w-6xl px-4 py-28 sm:px-6 sm:py-36 lg:px-8 lg:py-44 text-center">
          <span className="mb-8 inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary shadow-sm">
            Sports psychology + performance tracking
          </span>

          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            Optimize your athletic abilities —{" "}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              guided by a sports psychologist.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Track what matters, stay consistent, and perform when it counts.
            Anchor connects athletes with their sports psychologists on one
            platform built for the mental and physical demands of elite sport.
          </p>

          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="gap-2 px-8 shadow-md shadow-primary/20">
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
      <section id="features" className="border-b py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to reach your peak
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Anchor brings together the tools athletes and sports psychologists
              need — in one seamless platform.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="group transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
              >
                <CardHeader>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 transition-colors group-hover:bg-primary/15">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* How it works                                                        */}
      {/* ------------------------------------------------------------------ */}
      <section id="how-it-works" className="border-b py-24 sm:py-32 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Get started in three simple steps.
            </p>
          </div>

          <div className="grid gap-10 sm:grid-cols-3 sm:gap-8">
            {steps.map((step, i) => (
              <div key={step.number} className="relative flex flex-col items-center text-center">
                {/* Connector line (hidden on first item and mobile) */}
                {i > 0 && (
                  <div
                    aria-hidden
                    className="absolute -left-4 top-7 hidden h-px w-8 bg-border sm:block lg:-left-4 lg:w-8"
                  />
                )}
                <span className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold shadow-md shadow-primary/25">
                  {step.number}
                </span>
                <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground max-w-xs">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Dual CTA                                                            */}
      {/* ------------------------------------------------------------------ */}
      <section id="get-started" className="py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Athletes */}
            <div className="group flex flex-col items-start justify-between rounded-2xl border bg-card p-8 shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
              <div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">I&apos;m an Athlete</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  Track your psychological and physical state, complete
                  assessments, and stay aligned with your psychologist between
                  sessions.
                </p>
              </div>
              <Link href="/register" className="mt-8">
                <Button size="lg" className="gap-2 shadow-sm">
                  Sign up as an athlete
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Psychologists */}
            <div className="group flex flex-col items-start justify-between rounded-2xl border bg-card p-8 shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
              <div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">I&apos;m a Sports Psychologist</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  Monitor your full caseload in one dashboard — view daily
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
      <footer className="border-t bg-muted/20 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Anchor className="h-4 w-4 text-primary" />
            <span>Anchor</span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Anchor. Sports psychology performance tracking.
          </p>
          <div className="flex gap-6 text-sm">
            <Link
              href="/login"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
