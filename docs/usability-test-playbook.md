# Anchor — Usability Test Playbook

> **Purpose**: Equip every team member to observe user sessions consistently and capture the four things we need to track:
> 1. **Setup/workflow sticking points** — anything that slows or blocks the user from getting started
> 2. **Interface misconceptions** — users who interpret a control or label differently than intended
> 3. **Documentation holes** — questions that a complete doc should have answered but didn't
> 4. **User questions** — anything the user asks the facilitator (every question is a gap)

---

## Roles During a Session

| Role | Responsibility |
|------|---------------|
| **Facilitator** | Runs the script, asks follow-up questions, keeps the user talking |
| **Observer 1** | Logs raw observations against the checklist below, captures verbatim quotes |
| **Observer 2** | Tracks time-on-task and notes emotional tone; files GitHub issues after the session |

---

## Pre-Session Checklist

- [ ] App is deployed and reachable (production: `https://anchor-testwebsite.vercel.app/` or locally at `http://localhost:3000`)
- [ ] Test accounts created (or user will register fresh — preferred for Registration task)
- [ ] Screen share is visible to all observers
- [ ] Note-taking template is open (see section below)
- [ ] Observer has GitHub access to file issues

---

## Task Scripts

Run these in order. Give the user the task card text only — do **not** explain how to do it.

### Task 1 — Registration (Athlete)

> "You're an athlete who wants to start tracking your wellbeing. Please create an account."

**Probing questions:**
- "What do you expect to happen after you click 'Create Account'?"
- "Is the role selection ('Athlete' vs 'Psychologist') clear to you?"

**Known sticking points to watch for:**
- User confused by email-confirmation flow (Supabase sends a confirmation email by default)
- Vercel "Failed to fetch" if environment variables are misconfigured
- User tries to use a password shorter than 6 characters

---

### Task 2 — Registration (Psychologist)

> "You are a sports psychologist. Create an account for yourself."

**Probing questions:**
- "What do you expect to see once you log in as a psychologist?"
- "Does anything about the registration flow feel different from what you expected?"

---

### Task 3 — Athlete: Log a Check-In

> "You've just finished a training session. Log how you're feeling today."

**Probing questions:**
- "What does the number scale represent to you?"
- "Where would you expect to see what you just submitted?"

**Known sticking points to watch for:**
- Emoji scale direction (1 = 😞, 10 = 🤩) — users sometimes assume 1 = best
- User looks for a save confirmation and doesn't notice the latest check-in card
- User not sure if the notes field is optional

---

### Task 4 — Athlete: Verify Check-In on Dashboard

> "Check that the check-in you just logged is showing up somewhere on your dashboard."

**Probing questions:**
- "Is the calendar event where you expected it?"
- "What does the Mood filter do in your mental model?"

**Known sticking points to watch for:**
- Mood filter is off by default — user doesn't see the card until they enable it
- User unclear on difference between "Dashboard" calendar events and the "Latest Check-In" card

---

### Task 5 — Psychologist: Assign an Athlete and View Their Data

> "You have an athlete who just registered. Find their check-in data."

**Probing questions:**
- "How would you add this athlete to your caseload?"
- "Can you tell what an athlete's overall wellbeing trend has been this week?"

**Known sticking points to watch for:**
- Athlete must assign themselves to the psychologist — many users expect the psychologist to invite
- Caseload list is in the sidebar — not visible until an assignment exists
- Empty state on psychologist dashboard before any athletes are assigned

---

### Task 6 — Local Setup (Developer/Teammate)

> "Clone the repo and get the app running locally. Use only the README."

**Probing questions:**
- "Which step was the hardest to follow?"
- "Were the environment variable instructions clear?"

**Known sticking points to watch for:**
- `.env.example` not found or not copied before running
- Supabase migration SQL step requires manual execution — easy to skip
- Node.js version requirement (18.17+) not noticed
- Supabase URL configuration (redirect URLs) not set before testing auth

---

## Observation Checklist

During each task, mark any occurrence of the following. Use the note-taking template below to log specifics.

### Setup / Workflow Sticking Points
- [ ] User pauses for more than 10 seconds without knowing what to do next
- [ ] User makes an incorrect action (clicks wrong thing, submits prematurely)
- [ ] User expresses frustration or confusion out loud
- [ ] User backtracks to a previous step
- [ ] Error message appears; user is unsure how to resolve it
- [ ] User cannot complete the task without help

### Interface Misconceptions
- [ ] User reads a label differently than its intent
- [ ] User expects a control to do something other than what it does
- [ ] User is surprised by a navigation destination
- [ ] User interprets a data display (e.g., emoji scale) in an unexpected direction
- [ ] User confused by empty state (no events, no athletes, no check-ins)

### Documentation Holes
- [ ] User asks a question that the README or docs should answer
- [ ] User misses a prerequisite step that is in the docs but not found
- [ ] User is unsure what "PKCE" / "Row-Level Security" / other technical terms mean
- [ ] User searches for documentation and cannot find the relevant section

### User Questions (log every one verbatim)
- [ ] User asks about the purpose of a feature
- [ ] User asks what happens next after an action
- [ ] User asks who can see their data
- [ ] User asks how to undo something
- [ ] Any other direct question to the facilitator

---

## Note-Taking Template

Copy one block per observation:

```
---
OBSERVATION
  Task:           [Task 1–6]
  Category:       [setup | misconception | doc-hole | question]
  Severity:       [low | medium | high | blocking]
  Timestamp:      [mm:ss into session]
  
  What happened:  [Describe the behaviour or quote verbatim]
  
  Where:          [Page/component/URL path]
  
  Reproduction:   [Minimal steps to reproduce]
  
  Suggested fix:
    Code:         [Component or route to change, if applicable]
    Docs:         [README section or docs/sprint-x.md, if applicable]
    Label:        [setup | ux | docs | bug]
---
```

---

## Severity Definitions

| Level | Definition |
|-------|-----------|
| **blocking** | User cannot complete the core task at all |
| **high** | User completes the task but requires significant extra effort or guessing |
| **medium** | User is slowed or confused but recovers on their own |
| **low** | Minor friction; user barely notices |

---

## How to File Issues After the Session

1. Go to the repo on GitHub → **Issues → New Issue**.
2. Title format: `[Category] Short description` — e.g., `[ux] Mood filter off by default hides check-in card`.
3. Apply **one primary label** from the set below plus a severity label:

| Primary label | Use when |
|---------------|---------|
| `setup` | Blocks or slows local/production setup |
| `ux` | Interface behaviour or copy is confusing |
| `docs` | README or sprint doc is missing or wrong |
| `bug` | Functionality is broken |

4. In the issue body, paste the filled-out observation block from the template above.
5. Attach screenshots or screen recordings where possible.
6. If you can reproduce it locally, paste the browser console output and network errors.

---

## In-App Feedback

Users can also submit feedback directly from the app via the **Feedback** link in the navigation. Submissions are stored in Supabase and reviewable on the **Psychologist Dashboard → Feedback Reports** page. This is intended to capture real-time confusion as users encounter it, not as a replacement for structured observation sessions.

---

## Post-Session Debrief (5 minutes)

After each session, the team should answer:

1. Which observations were **blocking**?
2. What was the single most common misconception?
3. Which documentation hole would have prevented the most friction?
4. What is the one change we would make before the next session?
