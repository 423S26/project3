# Sprint 1: Application Skeleton & Dashboard

## Sprint Goal (SMART)

By the end of **Week 2**, deliver a running Next.js application with working navigation across all sections and a unified calendar dashboard displaying mock events with filter functionality, meeting the acceptance criteria below.

---

## Scope

### Dashboard
- Calendar shell (month/week toggle)
- Filter chips (Training / Recovery / Mood / Fueling / Assessments)
- "Today" panel with mock entries

### Sessions
- Page stub (layout only)

### Psychological State
- Page stub (layout only)

### Physical State
- Page stub with section headers:
  - Recovery
  - Training Load
  - Fueling

### Assessments
- Page stub

### Settings
- Page stub with privacy emphasis

---

## Acceptance Criteria

### 1. Navigation Works
- [ ] All routes render within the same app shell
- [ ] Clicking nav links changes routes without full page reload
- [ ] Active page is highlighted in navigation
- [ ] Mobile navigation drawer works on small screens
- [ ] Desktop sidebar is always visible on large screens

### 2. Calendar Renders
- [ ] Dashboard page renders calendar widget
- [ ] Toggle button flips between Month and Week views
- [ ] Calendar navigation (prev/next/today) works correctly
- [ ] Current date is highlighted

### 3. Mock Events Appear
- [ ] Events appear with category label and color
- [ ] Filter toggles show/hide events by category
- [ ] Five categories: Training (blue), Recovery (green), Mood (violet), Fueling (orange), Assessments (teal)
- [ ] Today panel lists events for the current day
- [ ] Events display time and description

---

## Technical Decisions

| Area | Decision |
|------|----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Calendar | FullCalendar (@fullcalendar/react) |
| Icons | Lucide React |
| Mock Data | Local TypeScript modules |

---

## File Structure

```
app/
├── layout.tsx                  # Root layout with AppShell
├── page.tsx                    # Dashboard (Calendar)
├── globals.css                 # Global styles + CSS variables
├── sessions/page.tsx           # Sessions stub
├── psychological-state/page.tsx # Psychological State stub
├── physical-state/page.tsx     # Physical State stub (with sections)
├── assessments/page.tsx        # Assessments stub
└── settings/page.tsx           # Settings stub

components/
├── app-shell/                  # Navigation components
├── calendar/                   # Calendar components
└── ui/                         # shadcn/ui components

lib/
├── event-types.ts              # Event category definitions
├── mock-events.ts              # Mock event data
└── utils.ts                    # Utility functions
```

---

## Demo Script

### 1. Navigation Demo
1. Open the app at `http://localhost:3000`
2. Verify the sidebar shows all 6 navigation items
3. Click each nav item: Dashboard, Sessions, Psychological State, Physical State, Assessments, Settings
4. Confirm consistent layout across all pages
5. On mobile viewport, verify hamburger menu opens drawer

### 2. Calendar Demo
1. Navigate to Dashboard
2. Verify calendar displays in Month view by default
3. Click "Week" toggle to switch to Week view
4. Click "Month" toggle to return to Month view
5. Use navigation arrows to move between months/weeks
6. Click "Today" button to return to current date

### 3. Events & Filters Demo
1. On Dashboard, observe mock events on the calendar
2. Note the different colors for each category:
   - Blue = Training (strength sessions, intervals)
   - Green = Recovery (active recovery, sleep blocks)
   - Violet = Mood (check-ins, reflections)
   - Orange = Fueling (meals, hydration)
   - Teal = Assessments (wellbeing checks, readiness scores)
3. Click filter toggles to hide/show categories
4. Verify Today panel updates when filters change
5. If today has events, verify they appear in the Today panel

---

## Team Notes

- **Sprint Duration**: Weeks 1-2
- **Course**: ESOF 423 - Spring 2026
- **App Name**: Anchor
- **Domain**: Sports Psychology / Athlete Wellbeing
