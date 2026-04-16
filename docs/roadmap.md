# Anchor Development Roadmap

## Product Vision

Anchor is a mental and physical wellbeing tracking platform for sports psychologists and their clients. It provides a unified, calendar-driven view where psychological state, physical recovery, training load, and practitioner sessions are tracked together.

---

## Sprint Overview

| Sprint | Weeks | Focus | Key Deliverables |
|--------|-------|-------|------------------|
| 1 | 1-2 | Skeleton & Dashboard | Navigation, calendar, mock data |
| 2 | 3-4 | Psychological Check-Ins | Mood/stress/motivation logging |
| 3 | 5-6 | Sessions & Physical State | Session scheduling, recovery/training load tracking |
| 4 | 7-8 | Assessments | Assessment templates, due dates, reminders |
| 5 | 9-10 | Fueling & Trends | Nutrition logging, trend charts |
| 6 | 11-12 | Polish & Demo | UI consistency, ethics, presentation |

---

## Sprint 1 (Weeks 1-2): Application Skeleton & Dashboard

**Goal**: Deliver a running app with navigation and a unified calendar using mock data.

### Deliverables
- Dashboard with calendar shell (month/week toggle)
- Filter chips (Training / Recovery / Mood / Fueling / Assessments)
- "Today" panel with mock entries
- Page stubs: Sessions, Psychological State, Physical State, Assessments, Settings

### Acceptance Criteria
- Navigation works between all pages
- Calendar renders with month/week toggle
- Mock events appear with category colors

---

## Sprint 2 (Weeks 3-4): Psychological Check-Ins

**Goal**: Track daily psychological state and show it on the dashboard.

### Deliverables
- **Psychological State Page**
  - Daily check-in form: Mood, Stress, Motivation (1–10 scale with emoji per number)
  - Optional notes; Submit + store in browser localStorage
  - Calendar "Check-In" event (Mood category)
  - Latest check-in summary and quick stats on page
- **Dashboard**
  - Latest Check-In card in sidebar when Mood filter is on
  - Today panel merges mock events + stored check-ins; Mood filter toggles visibility
- Physical State / Fueling: Still stubbed
- Assessments: Still stubbed

### Acceptance Criteria
- User logs a check-in and it persists across refresh
- Check-In event appears on calendar
- Dashboard Today sidebar shows latest psychological state (when Mood filter on)
- Turning off Mood filter hides check-in card and mood events

---

## Sprint 3 (Weeks 5-6): Sessions & Physical State

**Goal**: Support practitioner sessions and begin physical recovery / training load tracking.

### Deliverables
- **Sessions Page**
  - Session scheduling (date/time/type)
  - Notes field
  - Calendar integration
- **Physical State Page**
  - Recovery log: Fatigue, Soreness, Sleep quality
  - Training load entry
  - Calendar events for training/recovery blocks
- **Dashboard**
  - Sessions + physical state entries appear
  - Today panel shows recovery status
  - Filters for Training / Recovery
- Psychological State: Minor polish

### Acceptance Criteria
- Create session → shows on calendar
- Recovery/training load logged → stored + reflected

---

## Sprint 4 (Weeks 7-8): Assessments

**Goal**: Support basic wellbeing assessments with templates, scheduling, and reminders.

### Deliverables
- **Assessments Page**
  - Simple assessment templates: Weekly wellbeing, Readiness score
  - Due dates
  - Calendar reminders
- **Dashboard**
  - Sessions + assessments appear
  - Due-soon list
- Fueling: Still minimal (checkbox placeholder)

### Acceptance Criteria
- Complete assessment → stored + reflected

---

## Sprint 5 (Weeks 9-10): Fueling & Trends

**Goal**: Add fueling tracking and visualize trends across systems.

### Deliverables
- **Physical State → Fueling**
  - Log fueling events: Meal time, Type (meal/snack), Notes
  - Calendar blocks for fueling
- **Dashboard**
  - Fueling status in Today panel
  - Combined view: Mood + recovery + fueling correlations (basic)
- **Trends**
  - Simple charts: Mood over time, Recovery over time, Fueling consistency

### Acceptance Criteria
- Fueling logged
- Appears on calendar
- Trend charts render

---

## Sprint 6 (Weeks 11-12): Polish, Ethics, Demo Readiness

**Goal**: Make the system cohesive, safe, and presentation-ready.

### Deliverables
- **All Tabs**
  - UI consistency
  - Empty states
  - Error handling
- **Settings**
  - Goals (recovery, check-in frequency)
  - Units
  - Dark mode
- **System-Wide**
  - Privacy & ethics notice
  - Demo flow: Add session → Log mood → Log recovery → View dashboard

### Acceptance Criteria
- Smooth demo
- No crashes
- Clear client story

---

## Feature Mapping (Old → New)

| Old Section | New Section | Purpose |
|-------------|-------------|---------|
| Home | Dashboard | Unified calendar view |
| Schedule | Sessions | Practitioner appointments |
| Health | Physical State | Recovery, training, fueling |
| Finance | Psychological State | Mood, stress, motivation |
| Settings | Settings | Profile, privacy, goals |

---

## Ethical & Safety Statement

Anchor does not provide medical or psychological diagnosis or treatment. All data is self-reported and intended to support reflection and practitioner-guided discussion.

---

## Technical Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Calendar**: FullCalendar
- **Icons**: Lucide React
- **State**: React hooks (local state for Sprint 1)
