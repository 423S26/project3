-- ============================================================
-- Anchor: Physical State – Recovery, Training, Fueling
-- Migration 004: Tables + RLS for wearable integrations,
--   recovery metrics, workouts, and meal logs
-- ============================================================

-- ─── Integration Connections (OAuth tokens) ─────────────────
-- Tokens are ONLY accessed server-side via the service role.
-- RLS is enabled but NO browser-facing read policies are created.

create table public.integration_connections (
  id            uuid        primary key default gen_random_uuid(),
  athlete_id    uuid        not null references public.profiles(id) on delete cascade,
  provider      text        not null check (provider in ('fitbit', 'oura', 'whoop')),
  access_token  text        not null,
  refresh_token text,
  expires_at    timestamptz,
  scope         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- one connection per provider per athlete
  constraint integration_connections_athlete_provider_unique
    unique (athlete_id, provider)
);

alter table public.integration_connections enable row level security;
-- No browser-facing policies – all access via service role

create trigger integration_connections_updated_at
  before update on public.integration_connections
  for each row execute procedure public.handle_updated_at();

-- ─── Recovery Daily ─────────────────────────────────────────

create table public.recovery_daily (
  id            uuid        primary key default gen_random_uuid(),
  athlete_id    uuid        not null references public.profiles(id) on delete cascade,
  date          date        not null,
  source        text        not null default 'manual'
                            check (source in ('manual', 'fitbit', 'oura', 'whoop')),
  sleep_start   timestamptz,
  sleep_end     timestamptz,
  sleep_minutes integer,
  sleep_score   integer,
  resting_hr    integer,
  hrv_ms        real,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- one entry per source per day per athlete
  constraint recovery_daily_athlete_date_source_unique
    unique (athlete_id, date, source)
);

create index recovery_daily_athlete_date_idx
  on public.recovery_daily (athlete_id, date);

alter table public.recovery_daily enable row level security;

create policy "Athletes can view own recovery"
  on public.recovery_daily for select
  using (auth.uid() = athlete_id);

create policy "Athletes can insert own recovery"
  on public.recovery_daily for insert
  with check (auth.uid() = athlete_id);

create policy "Athletes can update own recovery"
  on public.recovery_daily for update
  using (auth.uid() = athlete_id);

create policy "Athletes can delete own recovery"
  on public.recovery_daily for delete
  using (auth.uid() = athlete_id);

create policy "Psychologists can view assigned athletes recovery"
  on public.recovery_daily for select
  using (
    public.current_user_role() = 'PSYCHOLOGIST'
    and exists (
      select 1 from public.psychologist_athletes
      where psychologist_id = auth.uid()
      and athlete_id = recovery_daily.athlete_id
    )
  );

create trigger recovery_daily_updated_at
  before update on public.recovery_daily
  for each row execute procedure public.handle_updated_at();

-- ─── Workout Templates ──────────────────────────────────────

create table public.workout_templates (
  id          uuid        primary key default gen_random_uuid(),
  athlete_id  uuid        not null references public.profiles(id) on delete cascade,
  name        text        not null,
  sport       text,
  type        text        not null default 'strength'
                          check (type in ('strength', 'sport_session')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index workout_templates_athlete_idx
  on public.workout_templates (athlete_id);

alter table public.workout_templates enable row level security;

create policy "Athletes can manage own templates"
  on public.workout_templates for all
  using (auth.uid() = athlete_id)
  with check (auth.uid() = athlete_id);

create policy "Psychologists can view assigned athletes templates"
  on public.workout_templates for select
  using (
    public.current_user_role() = 'PSYCHOLOGIST'
    and exists (
      select 1 from public.psychologist_athletes
      where psychologist_id = auth.uid()
      and athlete_id = workout_templates.athlete_id
    )
  );

create trigger workout_templates_updated_at
  before update on public.workout_templates
  for each row execute procedure public.handle_updated_at();

-- ─── Workout Template Exercises ─────────────────────────────

create table public.workout_template_exercises (
  id            uuid    primary key default gen_random_uuid(),
  template_id   uuid    not null references public.workout_templates(id) on delete cascade,
  exercise_name text    not null,
  default_sets  integer,
  default_reps  integer,
  default_weight_kg real,
  sort_order    integer not null default 0
);

create index workout_template_exercises_template_idx
  on public.workout_template_exercises (template_id);

alter table public.workout_template_exercises enable row level security;

-- Access governed by parent template ownership
create policy "Athletes can manage own template exercises"
  on public.workout_template_exercises for all
  using (
    exists (
      select 1 from public.workout_templates t
      where t.id = workout_template_exercises.template_id
      and t.athlete_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workout_templates t
      where t.id = workout_template_exercises.template_id
      and t.athlete_id = auth.uid()
    )
  );

create policy "Psychologists can view assigned athletes template exercises"
  on public.workout_template_exercises for select
  using (
    public.current_user_role() = 'PSYCHOLOGIST'
    and exists (
      select 1 from public.workout_templates t
      join public.psychologist_athletes pa on pa.athlete_id = t.athlete_id
      where t.id = workout_template_exercises.template_id
      and pa.psychologist_id = auth.uid()
    )
  );

-- ─── Workout Sessions ───────────────────────────────────────

create table public.workout_sessions (
  id           uuid        primary key default gen_random_uuid(),
  athlete_id   uuid        not null references public.profiles(id) on delete cascade,
  template_id  uuid        references public.workout_templates(id) on delete set null,
  type         text        not null default 'strength'
                           check (type in ('strength', 'sport_session')),
  name         text        not null,
  sport        text,
  started_at   timestamptz not null default now(),
  ended_at     timestamptz,
  duration_min integer,
  rpe          integer     check (rpe is null or (rpe between 1 and 10)),
  intensity    text,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index workout_sessions_athlete_started_idx
  on public.workout_sessions (athlete_id, started_at);

alter table public.workout_sessions enable row level security;

create policy "Athletes can manage own sessions"
  on public.workout_sessions for all
  using (auth.uid() = athlete_id)
  with check (auth.uid() = athlete_id);

create policy "Psychologists can view assigned athletes sessions"
  on public.workout_sessions for select
  using (
    public.current_user_role() = 'PSYCHOLOGIST'
    and exists (
      select 1 from public.psychologist_athletes
      where psychologist_id = auth.uid()
      and athlete_id = workout_sessions.athlete_id
    )
  );

create trigger workout_sessions_updated_at
  before update on public.workout_sessions
  for each row execute procedure public.handle_updated_at();

-- ─── Workout Session Exercises ──────────────────────────────

create table public.workout_session_exercises (
  id            uuid    primary key default gen_random_uuid(),
  session_id    uuid    not null references public.workout_sessions(id) on delete cascade,
  exercise_name text    not null,
  sort_order    integer not null default 0
);

create index workout_session_exercises_session_idx
  on public.workout_session_exercises (session_id);

alter table public.workout_session_exercises enable row level security;

create policy "Athletes can manage own session exercises"
  on public.workout_session_exercises for all
  using (
    exists (
      select 1 from public.workout_sessions s
      where s.id = workout_session_exercises.session_id
      and s.athlete_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workout_sessions s
      where s.id = workout_session_exercises.session_id
      and s.athlete_id = auth.uid()
    )
  );

create policy "Psychologists can view assigned athletes session exercises"
  on public.workout_session_exercises for select
  using (
    public.current_user_role() = 'PSYCHOLOGIST'
    and exists (
      select 1 from public.workout_sessions s
      join public.psychologist_athletes pa on pa.athlete_id = s.athlete_id
      where s.id = workout_session_exercises.session_id
      and pa.psychologist_id = auth.uid()
    )
  );

-- ─── Workout Sets ───────────────────────────────────────────

create table public.workout_sets (
  id                  uuid    primary key default gen_random_uuid(),
  session_exercise_id uuid    not null references public.workout_session_exercises(id) on delete cascade,
  set_number          integer not null,
  reps                integer,
  weight_kg           real,
  duration_sec        integer,
  notes               text
);

create index workout_sets_exercise_idx
  on public.workout_sets (session_exercise_id);

alter table public.workout_sets enable row level security;

create policy "Athletes can manage own sets"
  on public.workout_sets for all
  using (
    exists (
      select 1 from public.workout_session_exercises se
      join public.workout_sessions s on s.id = se.session_id
      where se.id = workout_sets.session_exercise_id
      and s.athlete_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workout_session_exercises se
      join public.workout_sessions s on s.id = se.session_id
      where se.id = workout_sets.session_exercise_id
      and s.athlete_id = auth.uid()
    )
  );

create policy "Psychologists can view assigned athletes sets"
  on public.workout_sets for select
  using (
    public.current_user_role() = 'PSYCHOLOGIST'
    and exists (
      select 1 from public.workout_session_exercises se
      join public.workout_sessions s on s.id = se.session_id
      join public.psychologist_athletes pa on pa.athlete_id = s.athlete_id
      where se.id = workout_sets.session_exercise_id
      and pa.psychologist_id = auth.uid()
    )
  );

-- ─── Meal Logs ──────────────────────────────────────────────

create table public.meal_logs (
  id              uuid        primary key default gen_random_uuid(),
  athlete_id      uuid        not null references public.profiles(id) on delete cascade,
  logged_at       timestamptz not null default now(),
  meal_type       text        check (meal_type is null or meal_type in ('breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout')),
  meal_name       text        not null,
  calories        real,
  protein_g       real,
  carbs_g         real,
  fat_g           real,
  fiber_g         real,
  edamam_food_json jsonb,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index meal_logs_athlete_logged_idx
  on public.meal_logs (athlete_id, logged_at);

alter table public.meal_logs enable row level security;

create policy "Athletes can manage own meals"
  on public.meal_logs for all
  using (auth.uid() = athlete_id)
  with check (auth.uid() = athlete_id);

create policy "Psychologists can view assigned athletes meals"
  on public.meal_logs for select
  using (
    public.current_user_role() = 'PSYCHOLOGIST'
    and exists (
      select 1 from public.psychologist_athletes
      where psychologist_id = auth.uid()
      and athlete_id = meal_logs.athlete_id
    )
  );

create trigger meal_logs_updated_at
  before update on public.meal_logs
  for each row execute procedure public.handle_updated_at();
