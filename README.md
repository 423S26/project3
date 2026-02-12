# Anchor - Sports Psychology Client App

A mental and physical wellbeing tracking platform for sports psychologists and their athletes.

## Overview

Anchor provides a unified, calendar-driven platform where psychological state, physical recovery, training load, and practitioner sessions are tracked together in one place.

### Who It's For

- **Primary Client**: Sports psychologists and performance-focused mental health professionals
- **End Users**: Athletes and physically active individuals

---

## Roles & What You Get

### Athlete

- **Daily check-ins** -- quick Mood / Stress / Motivation ratings (1-10 scale with emoji indicators) plus optional free-text notes
- **BRUMS-inspired assessment** -- optional expanded mood profiling alongside the quick check-in
- **Calendar integration** -- every check-in automatically appears as a color-coded event on the dashboard calendar
- **Per-user data isolation** -- each athlete only sees their own check-ins and profile data
- **Local-storage import** -- if you used the app before accounts existed, a one-click banner migrates your browser data into your account

### Psychologist

- **Dedicated login** -- role is selected at registration; the UI adapts accordingly
- **Athlete switcher** -- browse and select from a list of athletes to review
- **View athlete check-ins & calendar** -- see any athlete's mood, stress, and motivation history on the shared calendar view
- **Role-based access** -- middleware enforces that psychologists can view athlete data while athletes cannot see each other's data

---

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Calendar**: FullCalendar
- **Database**: Supabase (Postgres) with Row-Level Security
- **Auth**: Supabase Auth (email + password, PKCE flow)
- **Hosting**: Vercel (target)

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm, yarn, or pnpm
- A [Supabase](https://supabase.com) project

### Installation

1. Clone the repository:

```bash
git clone https://github.com/423S26/project3.git
cd project3
```

2. Install dependencies:

```bash
npm install
```

3. Copy the environment file and fill in your Supabase values:

```bash
cp .env.example .env.local
```

Required environment variables:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon / public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (server only) |

4. Run the database migration in the Supabase SQL Editor:

```
supabase/migrations/001_init.sql
```

5. Start the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
├── app/                        # Next.js App Router pages & API routes
│   ├── layout.tsx              # Root layout with navigation
│   ├── page.tsx                # Dashboard (Calendar)
│   ├── login/                  # Login page
│   ├── register/               # Registration page (role selection)
│   ├── sessions/               # Practitioner sessions
│   ├── psychological-state/    # Mood, stress, motivation check-ins
│   ├── physical-state/         # Recovery, training, fueling
│   ├── assessments/            # Wellbeing assessments
│   ├── settings/               # User preferences & privacy
│   └── api/                    # API routes (auth, check-ins, athletes)
├── components/
│   ├── app-shell/              # Navigation & layout components
│   ├── auth/                   # Auth context, session provider, user menu
│   ├── calendar/               # Calendar & event components
│   ├── psych/                  # Check-in form, latest card, stats
│   └── ui/                     # shadcn/ui base components
├── lib/
│   ├── supabase/               # Supabase client (browser + server)
│   ├── auth-helpers.ts         # Auth utility functions
│   ├── event-types.ts          # Event type definitions
│   ├── mock-events.ts          # Mock event data
│   └── utils.ts                # Utility functions
├── supabase/
│   └── migrations/             # SQL migrations (001_init.sql)
├── scripts/                    # One-off utilities (SQLite migration)
└── docs/                       # Sprint documentation
```

## Core Features

### Unified Dashboard
- Calendar-based view of all wellbeing activity
- Daily summaries for mood, recovery, and training
- Filter chips: Training / Recovery / Mood / Fueling / Assessments

### Psychological State Tracking (Sprint 2)
- Daily mood, stress, motivation check-ins (1-10 emoji scale)
- Optional BRUMS-inspired extended assessment
- Check-in events appear on dashboard calendar
- Latest check-in summary card

### Sessions Management
- Schedule and document practitioner sessions
- View session history alongside wellbeing data

### Physical State Tracking
- Training load logging
- Recovery and fatigue tracking
- Fueling consistency

### Assessments
- Periodic wellbeing assessments
- Due dates and reminders
- Longitudinal tracking

### Authentication & Roles
- Supabase Auth with email + password (PKCE)
- Role selection at registration (Athlete or Psychologist)
- Middleware-enforced route protection
- Session management with automatic refresh

### Privacy & Data Control
- Row-Level Security on all tables
- Per-user data isolation
- No diagnosis or treatment claims

---

## Documentation

| Document | Description |
|----------|-------------|
| [Sprint 1](docs/sprint-1.md) | Application skeleton, navigation, dashboard calendar with mock data |
| [Sprint 2](docs/sprint-2.md) | Psychological check-ins, Supabase auth, role-based access |
| [Roadmap](docs/roadmap.md) | Full 6-sprint development plan |

---

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Ethical & Safety Statement

Anchor does not provide medical or psychological diagnosis or treatment. All data is self-reported and intended to support reflection and practitioner-guided discussion.

## License

Private - ESOF 423 Course Project - Spring 2026
