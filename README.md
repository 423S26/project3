# Anchor - Sports Psychology Client App

A mental and physical wellbeing tracking platform for sports psychologists and their athletes.

## Getting Started

### Try the App

Visit the live site: **[https://anchor-testwebsite.vercel.app/](https://anchor-testwebsite.vercel.app/)**

Register as an Athlete or Psychologist to explore all features.

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

### Local Development

If you want to run the project locally:

**Prerequisites**

- Node.js 18.17 or later
- npm, yarn, or pnpm
- A [Supabase](https://supabase.com) project

**Setup**

1. Install dependencies:

```bash
npm install
```

2. Copy the environment file and fill in your Supabase values:

```bash
cp .env.example .env.local
```

Required environment variables:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon / public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (server only) |

3. Run the database migration in the Supabase SQL Editor:

```
supabase/migrations/001_init.sql
```

4. Start the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Deploying to Vercel (fixing "Failed to fetch" on sign-up)

If registration works locally but fails on Vercel with **"Failed to fetch"**, do the following:

1. **Set environment variables in Vercel**  
   In your Vercel project: **Settings → Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL (e.g. `https://xxxx.supabase.co`)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon/public key  
   Use the same values as in `.env.local`. Apply to **Production** (and Preview if you use it).

2. **Redeploy after adding env vars**  
   `NEXT_PUBLIC_*` variables are inlined at **build** time. After adding or changing them, trigger a new deployment (e.g. push a commit or use "Redeploy" in Vercel).

3. **Allow your Vercel URL in Supabase Auth**  
   In [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Authentication → URL Configuration**:
   - **Site URL**: set to your production URL (e.g. `https://your-app.vercel.app`)
   - **Redirect URLs**: add `https://your-app.vercel.app/**` (and `https://your-app.vercel.app` if you use it)

Without (1) and (2), the browser tries to call Supabase with a missing URL and you get "Failed to fetch". Without (3), auth can be blocked or redirects can fail.

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
| [Usability Test Playbook](docs/usability-test-playbook.md) | Team observation guide: sticking points, misconceptions, doc holes, user questions |

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
