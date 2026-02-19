-- ============================================================
-- Anchor: Feedback Reports
-- Migration 003: In-app user feedback capture for usability testing
-- ============================================================

-- ─── Table ───────────────────────────────────────────────────

create table public.feedback_reports (
  id                      uuid        primary key default gen_random_uuid(),
  created_at              timestamptz not null default now(),

  -- Who submitted (nullable: unauthenticated users on auth pages can still submit)
  user_id                 uuid        references public.profiles(id) on delete set null,
  user_role               text,

  -- Where they were
  page_path               text        not null default '',

  -- What kind of feedback
  category                text        not null
                          check (category in ('setup', 'ux', 'docs', 'question', 'bug', 'other')),

  severity                text        not null
                          check (severity in ('low', 'medium', 'high', 'blocking')),

  -- What they said
  what_were_you_trying    text        not null default '',
  message                 text        not null,

  -- Optional structured metadata (viewport, user-agent, etc.)
  metadata                jsonb
);

-- ─── Index ───────────────────────────────────────────────────

create index feedback_reports_created_at_idx
  on public.feedback_reports (created_at desc);

create index feedback_reports_user_id_idx
  on public.feedback_reports (user_id);

-- ─── Row Level Security ──────────────────────────────────────

alter table public.feedback_reports enable row level security;

-- Psychologists can view all feedback reports (team review surface)
create policy "Psychologists can view all feedback reports"
  on public.feedback_reports for select
  using (public.current_user_role() = 'PSYCHOLOGIST');

-- Athletes can view their own reports
create policy "Users can view own feedback reports"
  on public.feedback_reports for select
  using (auth.uid() = user_id);

-- Inserts go through the server-side API route using service role,
-- so no anon/user insert policy is needed here.
-- This prevents direct client-side writes bypassing rate-limiting or validation.
