"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion";
import {
  Anchor,
  Brain,
  Activity,
  BarChart2,
  ClipboardList,
  Users,
  ChevronRight,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* -------------------------------------------------------------------------- */
/*  Static data                                                                */
/* -------------------------------------------------------------------------- */

const features = [
  {
    icon: Brain,
    title: "Psychologist-Guided Training",
    description:
      "Work directly with a certified sports psychologist who monitors your mental and physical wellbeing every step of the way.",
  },
  {
    icon: Activity,
    title: "Physical & Psychological Tracking",
    description:
      "Log your mood, energy, stress, and physical state in one place so your psychologist always has the full picture.",
  },
  {
    icon: BarChart2,
    title: "Data-Driven Performance Insights",
    description:
      "Turn daily check-ins into trends your psychologist can act on—spot burnout early, capitalise on peak form.",
  },
  {
    icon: ClipboardList,
    title: "Structured Assessments",
    description:
      "Science-backed questionnaires (BRUMS and more) that give you and your psychologist a standardised baseline.",
  },
  {
    icon: Users,
    title: "Athlete & Psychologist Collaboration",
    description:
      "Athletes and their psychologists share a single platform—no more spreadsheets or back-and-forth emails.",
  },
  {
    icon: CheckCircle2,
    title: "Stay Consistent",
    description:
      "Scheduled check-ins, session notes, and calendar-synced assignments keep you on track between sessions.",
  },
];

const steps = [
  {
    number: "01",
    icon: Users,
    title: "Create your account",
    description:
      "Sign up as an athlete or sports psychologist in under a minute.",
  },
  {
    number: "02",
    icon: Brain,
    title: "Connect with your psychologist",
    description:
      "Your psychologist links you to their caseload and tailors your tracking programme.",
  },
  {
    number: "03",
    icon: Activity,
    title: "Track, reflect, and perform",
    description:
      "Daily check-ins, assessments, and session notes feed into personalised insights that drive real results.",
  },
];

const stats = [
  { value: "BRUMS", label: "Science-backed assessment standard" },
  { value: "2 roles", label: "Athletes & Psychologists" },
  { value: "1 platform", label: "Complete wellbeing picture" },
];

/* -------------------------------------------------------------------------- */
/*  Animation variants                                                         */
/* -------------------------------------------------------------------------- */

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

const springCircle: Variants = {
  hidden: { scale: 0.5, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 260, damping: 20 } },
};

/* -------------------------------------------------------------------------- */
/*  Reusable InView wrapper                                                    */
/* -------------------------------------------------------------------------- */

function InViewSection({
  children,
  variants = staggerContainer,
  className = "",
}: {
  children: React.ReactNode;
  variants?: Variants;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function LandingClient() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.4]);

  return (
    <div className="min-h-screen animate-bg-shift text-foreground scroll-smooth">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                              */}
      {/* ------------------------------------------------------------------ */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 sm:gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href="/landing"
            className="flex shrink-0 min-w-0 items-center gap-2 font-semibold text-lg tracking-tight text-white transition-opacity hover:opacity-80"
          >
            <Anchor className="h-6 w-6 text-primary shrink-0" />
            <span className="truncate">Anchor</span>
          </Link>

          <div className="flex flex-nowrap items-center gap-2 sm:gap-3">
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex text-slate-300 hover:text-white hover:bg-white/10 rounded-full px-3 sm:px-5"
              >
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="rounded-full px-3 sm:px-5 text-xs sm:text-sm">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Hero                                                                */}
      {/* ------------------------------------------------------------------ */}
      <section
        ref={heroRef}
        id="hero"
        className="relative isolate overflow-hidden min-h-[92vh] flex flex-col items-center justify-center"
      >
        {/* Background image with parallax */}
        <motion.div
          className="absolute inset-0 -z-20"
          style={{ scale: heroScale, opacity: heroOpacity }}
        >
          <Image
            src="https://images.unsplash.com/photo-1495563923587-bdc4282494d0?w=1920&q=80&auto=format&fit=crop"
            alt=""
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        </motion.div>

        {/* Dark gradient overlay */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-950/85 via-slate-950/70 to-slate-950/90"
        />

        {/* Subtle blue orb accent */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 50% 40% at 30% 55%, hsl(221.2 83.2% 53.3% / 0.15), transparent 70%)",
          }}
        />

        <div className="mx-auto max-w-6xl px-4 py-28 sm:px-6 sm:py-36 lg:px-8 text-center">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center gap-7"
          >
            {/* Overline with color-shifting background */}
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white/95 shadow-lg shadow-primary/20">
                Sports Psychology + Performance Tracking
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              className="text-5xl font-extrabold leading-[0.92] tracking-[-0.02em] sm:text-7xl lg:text-8xl"
              style={{ textShadow: "0 2px 30px rgba(0,0,0,0.4)" }}
            >
              <span className="text-white">Train your mind.</span>
              <br />
              <span className="bg-gradient-to-r from-primary via-indigo-400 to-blue-400 bg-clip-text text-transparent">
                Perform at your peak.
              </span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              variants={fadeUp}
              className="mx-auto max-w-xl text-lg leading-relaxed text-slate-300/90 sm:text-xl"
            >
              Track what matters, stay consistent, and perform when it counts.
              Anchor connects athletes with their sports psychologists on one
              platform built for the mental and physical demands of elite sport.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={fadeUp}
              className="flex flex-col items-center justify-center gap-4 sm:flex-row mt-2"
            >
              <Link href="/register">
                <Button
                  size="lg"
                  className="gap-2 px-8 shadow-lg shadow-primary/30 rounded-full"
                >
                  Start for free
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 rounded-full border-white/20 text-white hover:bg-white/10 hover:text-white bg-transparent"
                >
                  Sign in
                </Button>
              </Link>
            </motion.div>

            {/* Trust icons */}
            <motion.div
              variants={fadeUp}
              className="flex flex-wrap items-center justify-center gap-6 text-slate-400 text-xs mt-2"
            >
              <span className="flex items-center gap-1.5">
                <Brain className="h-4 w-4" /> Mental training
              </span>
              <span className="flex items-center gap-1.5">
                <Activity className="h-4 w-4" /> Physical tracking
              </span>
              <span className="flex items-center gap-1.5">
                <BarChart2 className="h-4 w-4" /> Data insights
              </span>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll chevron */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-400"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="h-6 w-6" />
        </motion.div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Stats bar                                                           */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-slate-950 border-y border-white/5 py-14">
        <InViewSection className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-white/10">
            {stats.map((stat) => (
              <motion.div
                key={stat.value}
                variants={fadeUp}
                className="flex flex-col items-center gap-1 text-center px-8"
              >
                <span className="text-3xl font-extrabold text-white tracking-tight">
                  {stat.value}
                </span>
                <span className="text-sm text-slate-400">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </InViewSection>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Feature cards                                                       */}
      {/* ------------------------------------------------------------------ */}
      <section id="features" className="border-b py-24 sm:py-32 bg-background">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <InViewSection className="mx-auto max-w-2xl text-center mb-16">
            <motion.h2
              variants={fadeUp}
              className="text-3xl font-bold tracking-tight sm:text-4xl"
            >
              Everything you need to reach your peak
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="mt-4 text-lg text-muted-foreground"
            >
              Anchor brings together the tools athletes and sports psychologists
              need — in one seamless platform.
            </motion.p>
          </InViewSection>

          <InViewSection className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  variants={cardVariants}
                  whileHover={{ y: -4, boxShadow: "0 20px 40px -12px hsl(221.2 83.2% 53.3% / 0.15)" }}
                  transition={{ type: "spring", stiffness: 300, damping: 24 }}
                  className="group relative flex flex-col rounded-2xl border bg-card p-6 shadow-sm overflow-hidden transition-colors hover:border-primary/30"
                >
                  {/* Glass shimmer on hover */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/5 via-transparent to-primary/5"
                  />
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-2 ring-primary/20 transition-colors group-hover:bg-primary/15 group-hover:ring-primary/35">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </InViewSection>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* How it works                                                        */}
      {/* ------------------------------------------------------------------ */}
      <section
        id="how-it-works"
        className="border-b py-24 sm:py-32 bg-muted/30"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <InViewSection className="mx-auto max-w-2xl text-center mb-16">
            <motion.h2
              variants={fadeUp}
              className="text-3xl font-bold tracking-tight sm:text-4xl"
            >
              How it works
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-lg text-muted-foreground">
              Get started in three simple steps.
            </motion.p>
          </InViewSection>

          <InViewSection className="grid gap-10 sm:grid-cols-3 sm:gap-8">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  variants={cardVariants}
                  whileHover={{ y: -4, boxShadow: "0 20px 40px -12px hsl(221.2 83.2% 53.3% / 0.15)" }}
                  transition={{ type: "spring", stiffness: 300, damping: 24 }}
                  className="group relative flex flex-col items-center text-center rounded-2xl border border-white/10 bg-slate-800 p-8 shadow-sm overflow-hidden transition-colors hover:border-primary/30"
                >
                  {/* Glass shimmer on hover */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/5 via-transparent to-primary/5"
                  />
                  {/* Step number label */}
                  <span className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
                    Step {step.number}
                  </span>
                  {/* Icon container */}
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-2 ring-primary/20 transition-colors group-hover:bg-primary/15 group-hover:ring-primary/35">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <motion.h3
                    variants={fadeUp}
                    className="mb-2 text-lg font-semibold text-white"
                  >
                    {step.title}
                  </motion.h3>
                  <motion.p
                    variants={fadeUp}
                    className="text-sm leading-relaxed text-slate-400 max-w-xs"
                  >
                    {step.description}
                  </motion.p>
                </motion.div>
              );
            })}
          </InViewSection>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Dual CTA                                                            */}
      {/* ------------------------------------------------------------------ */}
      <section id="get-started" className="py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <InViewSection className="grid gap-6 sm:grid-cols-2">
            {/* Athletes — dark card */}
            <motion.div
              variants={cardVariants}
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="flex flex-col items-start justify-between rounded-2xl bg-slate-950 p-8 text-white shadow-xl"
            >
              <div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 ring-1 ring-primary/30">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">I&apos;m an Athlete</h3>
                <p className="mt-3 leading-relaxed text-slate-400">
                  Track your psychological and physical state, complete
                  assessments, and stay aligned with your psychologist between
                  sessions.
                </p>
              </div>
              <Link href="/register" className="mt-8">
                <Button size="lg" className="gap-2 shadow-sm rounded-full">
                  Sign up as an athlete
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>

            {/* Psychologists — light card */}
            <motion.div
              variants={cardVariants}
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="flex flex-col items-start justify-between rounded-2xl border bg-card p-8 shadow-sm"
            >
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
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 rounded-full"
                >
                  Sign up as a psychologist
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </InViewSection>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Footer                                                              */}
      {/* ------------------------------------------------------------------ */}
      <footer className="border-t bg-slate-950 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            <Anchor className="h-4 w-4 text-primary" />
            <span>Anchor</span>
          </div>
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} Anchor. Sports psychology performance tracking.
          </p>
          <div className="flex gap-6 text-sm">
            <Link
              href="/login"
              className="text-slate-500 transition-colors hover:text-slate-300"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="text-slate-500 transition-colors hover:text-slate-300"
            >
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
