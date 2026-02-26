-- ============================================================
-- Anchor: Psychologist-Athlete Assignment (Caseload) Model
-- Migration 002: Restrict psychologist access to assigned athletes only
-- ============================================================

-- ─── New Table: psychologist_athletes ───────────────────────

create table public.psychologist_athletes (
  psychologist_id uuid        not null references public.profiles(id) on delete cascade,
  athlete_id      uuid        not null references public.profiles(id) on delete cascade,
  created_at      timestamptz not null default now(),
  
  -- One psychologist per athlete (athlete can only be assigned to one psychologist)
  constraint psychologist_athletes_athlete_unique unique (athlete_id),
  
  primary key (psychologist_id, athlete_id)
);

-- Index for fast caseload queries
create index psychologist_athletes_psychologist_idx 
  on public.psychologist_athletes (psychologist_id);

-- Enable RLS
alter table public.psychologist_athletes enable row level security;

-- ─── RLS Policies for psychologist_athletes ─────────────────

-- Athletes can view their own assignment
create policy "Athletes can view own assignment"
  on public.psychologist_athletes for select
  using (auth.uid() = athlete_id);

-- Psychologists can view their caseload
create policy "Psychologists can view own caseload"
  on public.psychologist_athletes for select
  using (auth.uid() = psychologist_id);

-- Athletes can create/update their own assignment (choose psychologist)
create policy "Athletes can manage own assignment"
  on public.psychologist_athletes for all
  using (auth.uid() = athlete_id)
  with check (auth.uid() = athlete_id);

-- Psychologists can manage their caseload (add/remove athletes)
create policy "Psychologists can manage own caseload"
  on public.psychologist_athletes for all
  using (
    auth.uid() = psychologist_id 
    and public.current_user_role() = 'PSYCHOLOGIST'
  )
  with check (
    auth.uid() = psychologist_id 
    and public.current_user_role() = 'PSYCHOLOGIST'
  );

-- ─── Update RLS Policies: profiles ──────────────────────────
-- Replace "Psychologists can view all profiles" with assignment-scoped access

drop policy if exists "Psychologists can view all profiles" on public.profiles;

create policy "Psychologists can view assigned athlete profiles"
  on public.profiles for select
  using (
    public.current_user_role() = 'PSYCHOLOGIST'
    and role = 'ATHLETE'
    and exists (
      select 1 from public.psychologist_athletes
      where psychologist_id = auth.uid()
      and athlete_id = profiles.id
    )
  );

-- Allow athletes to view psychologist profiles (for choosing a psychologist)
create policy "Athletes can view psychologist profiles"
  on public.profiles for select
  using (
    role = 'PSYCHOLOGIST'
    and public.current_user_role() = 'ATHLETE'
  );

-- ─── Update RLS Policies: athlete_profiles ──────────────────

drop policy if exists "Psychologists can view all athlete profiles" on public.athlete_profiles;

create policy "Psychologists can view assigned athlete profiles detail"
  on public.athlete_profiles for select
  using (
    public.current_user_role() = 'PSYCHOLOGIST'
    and exists (
      select 1 from public.psychologist_athletes
      where psychologist_id = auth.uid()
      and athlete_id = athlete_profiles.user_id
    )
  );

-- ─── Update RLS Policies: check_ins ─────────────────────────

drop policy if exists "Psychologists can view all check-ins" on public.check_ins;

create policy "Psychologists can view assigned athletes check-ins"
  on public.check_ins for select
  using (
    public.current_user_role() = 'PSYCHOLOGIST'
    and exists (
      select 1 from public.psychologist_athletes
      where psychologist_id = auth.uid()
      and athlete_id = check_ins.athlete_id
    )
  );

drop policy if exists "Psychologists can insert check-ins" on public.check_ins;

create policy "Psychologists can insert assigned athletes check-ins"
  on public.check_ins for insert
  with check (
    public.current_user_role() = 'PSYCHOLOGIST'
    and exists (
      select 1 from public.psychologist_athletes
      where psychologist_id = auth.uid()
      and athlete_id = check_ins.athlete_id
    )
  );
