# Sprint 2 (Weeks 3-4): Psychological Check-Ins

## Sprint Goal (SMART)

By the end of **Week 4**, users can **log a daily psychological check-in** (Mood, Stress, Motivation on a **1–10 scale with emojis** and optional notes), and the app will **persist** the check-in in **browser localStorage**, **display the latest check-in** on the Dashboard Today panel, and **render a corresponding Mood "Check-In" event** on the calendar that can be **shown/hidden via the Mood filter**, meeting the acceptance criteria below.

---

## Scope

### Psychological State Page
- Daily check-in form: Mood, Stress, Motivation (1–10 with emoji per number)
- Optional notes field
- Submit → validate → store to localStorage
- "Latest check-in" summary card on the page
- Quick stats (Today's Mood, Stress, Motivation) reflect latest check-in

### Dashboard
- **Latest Check-In** card in sidebar when Mood filter is on (Mood/Stress/Motivation + timestamp)
- Today panel merges mock events + stored check-in events for today (when Mood filter on)
- Turning off Mood filter hides the latest-check-in card and mood events

### Calendar
- Stored check-ins appear as "Check-In" events in the **Mood** category
- Calendar event list merges mock events + check-in events; Mood filter controls visibility

### Not in Scope (Sprint 2 original plan)
- Trend charts
- Sessions or assessments UI

> **Note:** Authentication (Supabase Auth with PKCE) and a backend database (Supabase Postgres) were implemented alongside Sprint 2 and are fully shipped. See `supabase/migrations/` for the schema and `app/api/auth/` for the auth routes.

---

## Acceptance Criteria

- [ ] User logs a check-in (1–10 + emoji + optional notes) and it persists across refresh.
- [ ] A "Check-In" event appears on the calendar on the submission date/time.
- [ ] Dashboard Today sidebar shows the latest check-in summary (when Mood filter is on).
- [ ] Turning off the Mood filter hides the check-in event(s) and the latest-check-in summary.

---

## Technical Notes

| Area | Choice |
|------|--------|
| Persistence | Browser localStorage (key: `anchor-psych-checkins`) |
| Scale | 1–10 with same emoji mapping for Mood, Stress, Motivation |
| Emoji scale | 1 😞 … 5 😐 … 10 🤩 |
| Event category | All check-ins → calendar as `mood` category |

---

## Demo Flow

1. **Log a check-in**
   - Go to **Psychological State**.
   - Select Mood, Stress, Motivation (1–10 via emoji buttons).
   - Optionally add notes.
   - Click **Save Check-In**.
   - Confirm "Latest Check-In" card appears/updates with your values.

2. **Persistence**
   - Refresh the page.
   - Confirm the latest check-in still appears.

3. **Dashboard**
   - Go to **Dashboard** (Home).
   - With **Mood** filter on: confirm **Latest Check-In** card shows in the sidebar.
   - Confirm a "Check-In" event appears on the calendar for the submission time.
   - Confirm "Check-In" appears in the Today list if submitted today.

4. **Mood filter**
   - Turn the **Mood** filter off.
   - Confirm the Latest Check-In card is hidden.
   - Confirm mood events (including Check-In) disappear from the calendar and Today list.
   - Turn Mood back on and confirm they reappear.

---

## Files Touched (Sprint 2)

### New
- `lib/psych-checkins.ts` – localStorage, list/save/latest, calendar event conversion
- `lib/emoji-scale.ts` – 1–10 emoji mapping
- `components/psych/check-in-form.tsx` – form with scale + notes
- `components/psych/latest-checkin-card.tsx` – dashboard sidebar card
- `components/psych/psychological-state-section.tsx` – form + latest card on Psych page
- `components/psych/psychological-state-stats.tsx` – top stat cards from latest check-in

### Updated
- `app/psychological-state/page.tsx` – integrated form and stats
- `components/calendar/home-dashboard.tsx` – LatestCheckInCard + merged today events
- `components/calendar/calendar-view.tsx` – merge mock + check-in events when Mood on

---

## Course Alignment (Phase 2)

- **Alpha prototype**: Check-ins are a major feature stubbed in Sprint 1 and **implemented** in Sprint 2.
- **Developer documentation**: Update living dev docs to describe check-in storage and calendar merge.
- **Backlog / burndown**: Sprint 2 goal and acceptance criteria above support completed sprint records.
