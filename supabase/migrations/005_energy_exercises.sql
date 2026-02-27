-- ============================================================
-- Anchor: Energy tracking + Exercise Library
-- Migration 005: Add bodyweight, calories columns, exercise_library
-- ============================================================

-- ─── 1. Athlete bodyweight (for MET calorie estimates) ─────

alter table public.athlete_profiles
  add column if not exists bodyweight_kg real;

-- ─── 2. Wearable calories out on recovery_daily ────────────

alter table public.recovery_daily
  add column if not exists calories_out_wearable real;

-- ─── 3. Workout sessions: calories estimate + sport subtype ─

alter table public.workout_sessions
  add column if not exists calories_out_est real,
  add column if not exists session_subtype text,
  add column if not exists sport_metadata jsonb;

-- ─── 4. Exercise Library (cached canonical exercises) ──────

create table if not exists public.exercise_library (
  id                    uuid        primary key default gen_random_uuid(),
  provider              text        not null default 'wger',
  provider_exercise_id  text        not null,
  name                  text        not null,
  category              text,
  muscles               jsonb       default '[]'::jsonb,
  equipment             jsonb       default '[]'::jsonb,
  description           text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  constraint exercise_library_provider_id_unique
    unique (provider, provider_exercise_id)
);

alter table public.exercise_library enable row level security;

-- Exercise library is a shared cache – any authenticated user can read
create policy "Authenticated users can view exercises"
  on public.exercise_library for select
  using (auth.uid() is not null);

-- Any authenticated user can insert (cache from wger search)
create policy "Authenticated users can insert exercises"
  on public.exercise_library for insert
  with check (auth.uid() is not null);

create trigger exercise_library_updated_at
  before update on public.exercise_library
  for each row execute procedure public.handle_updated_at();

-- ─── 5. Link template exercises to exercise library ────────

alter table public.workout_template_exercises
  add column if not exists exercise_library_id uuid
    references public.exercise_library(id) on delete set null;
