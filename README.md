# Anchor - Health & Finance Dashboard

A unified dashboard application for managing health, finance, and schedule in one place.

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

5. Open (http://localhost:3000) in your browser

## Project Structure

```
Project/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout with navigation
│   ├── page.tsx            # Home page (Calendar dashboard)
│   ├── schedule/           # Work/School schedule
│   ├── health/             # Workouts & Meals
│   ├── finance/            # Bills & Finance
│   └── settings/           # User preferences
├── components/
│   ├── app-shell/          # Navigation & layout components
│   ├── calendar/           # Calendar & event components
│   └── ui/                 # shadcn/ui base components
├── lib/
│   ├── event-types.ts      # Event type definitions
│   ├── mock-events.ts      # Mock event data
│   └── utils.ts            # Utility functions
```

## Sprint 1 Scope

- Project setup with Next.js + TypeScript + Tailwind
- Navigation between Home, Schedule, Health, Finance, Settings
- Home calendar with month/week toggle
- Mock events with category filters
- Today panel showing daily events

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

Private - ESOF 423 Course Project
