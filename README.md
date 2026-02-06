# Anchor - Sports Psychology Client App

A mental and physical wellbeing tracking platform for sports psychologists and their clients.

## Overview

Anchor provides a unified, calendar-driven platform where psychological state, physical recovery, training load, and practitioner sessions are tracked together in one place.

### Who It's For

- **Primary Client**: Sports psychologists and performance-focused mental health professionals
- **End Users**: Athletes and physically active individuals

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Calendar**: FullCalendar

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm, yarn, or pnpm

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Copy the environment file:

```bash
cp .env.example .env.local
```

4. Start the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
Project/
├── app/                        # Next.js App Router pages
│   ├── layout.tsx              # Root layout with navigation
│   ├── page.tsx                # Dashboard (Calendar)
│   ├── sessions/               # Practitioner sessions
│   ├── psychological-state/    # Mood, stress, motivation
│   ├── physical-state/         # Recovery, training, fueling
│   ├── assessments/            # Wellbeing assessments
│   └── settings/               # User preferences & privacy
├── components/
│   ├── app-shell/              # Navigation & layout components
│   ├── calendar/               # Calendar & event components
│   └── ui/                     # shadcn/ui base components
├── lib/
│   ├── event-types.ts          # Event type definitions
│   ├── mock-events.ts          # Mock event data
│   └── utils.ts                # Utility functions
└── docs/                       # Sprint documentation
```

## Core Features

### Unified Dashboard
- Calendar-based view of all wellbeing activity
- Daily summaries for mood, recovery, and training
- Filter chips: Training / Recovery / Mood / Fueling / Assessments

### Sessions Management
- Schedule and document practitioner sessions
- View session history alongside wellbeing data

### Psychological State Tracking
- Daily mood, stress, motivation check-ins
- Trend visualization over time

### Physical State Tracking
- Training load logging
- Recovery and fatigue tracking
- Fueling consistency

### Assessments
- Periodic wellbeing assessments
- Due dates and reminders
- Longitudinal tracking

### Privacy & Data Control
- Client-owned data
- Exportable summaries
- No diagnosis or treatment claims

## Sprint 1 Scope (Current)

- Application skeleton with Next.js + TypeScript + Tailwind
- Navigation between Dashboard, Sessions, Psychological State, Physical State, Assessments, Settings
- Dashboard calendar with month/week toggle
- Mock events with 5 category filters
- Today panel showing daily events

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Ethical & Safety Statement

Anchor does not provide medical or psychological diagnosis or treatment. All data is self-reported and intended to support reflection and practitioner-guided discussion.

## License

Private - ESOF 423 Course Project - Spring 2026
