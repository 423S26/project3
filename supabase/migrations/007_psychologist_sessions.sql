-- ============================================================
-- Anchor: Psychologist Sessions (Athlete Self-Booking)
-- Migration 007: Athletes can schedule sessions with their
--   assigned psychologist (virtual or in-person).
-- ============================================================

create type public.session_type   as enum ('virtual', 'in_person');
create type public.session_status as enum ('scheduled', 'completed', 'cancelled');

create table public.psychologist_sessions (
  id               uuid          primary key default gen_random_uuid(),
  athlete_id       uuid          not null references public.profiles(id) on delete cascade,
  psychologist_id  uuid          not null references public.profiles(id) on delete cascade,
  session_type     public.session_type   not null,
  status           public.session_status not null default 'scheduled',
  starts_at        timestamptz   not null,
  duration_min     int           not null default 50,
  location         text,
  notes            text,
  created_at       timestamptz   not null default now(),
  updated_at       timestamptz   not null default now()
);

create index psychologist_sessions_athlete_idx
  on public.psychologist_sessions (athlete_id, starts_at);

create index psychologist_sessions_psychologist_idx
  on public.psychologist_sessions (psychologist_id, starts_at);

-- Enable RLS
alter table public.psychologist_sessions enable row level security;

-- Athletes can view their own sessions
create policy "Athletes can view own sessions"
  on public.psychologist_sessions for select
  using (auth.uid() = athlete_id);

-- Athletes can create sessions for themselves
create policy "Athletes can create own sessions"
  on public.psychologist_sessions for insert
  with check (
    auth.uid() = athlete_id
    and public.current_user_role() = 'ATHLETE'
  );

-- Athletes can update their own sessions (cancel / reschedule)
create policy "Athletes can update own sessions"
  on public.psychologist_sessions for update
  using (auth.uid() = athlete_id)
  with check (auth.uid() = athlete_id);

-- Psychologists can view sessions for their assigned athletes
create policy "Psychologists can view assigned athlete sessions"
  on public.psychologist_sessions for select
  using (
    auth.uid() = psychologist_id
    and public.current_user_role() = 'PSYCHOLOGIST'
  );

-- Auto-update updated_at on row change
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger psychologist_sessions_updated_at
  before update on public.psychologist_sessions
  for each row execute function public.set_updated_at();
