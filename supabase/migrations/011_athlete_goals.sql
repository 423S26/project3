-- ============================================================
-- Anchor: Athlete Goals
-- Migration 011: Athletes can create, track, and complete goals
--   across weight, performance, training, and custom categories.
--   Psychologists can view goals for assigned athletes.
-- ============================================================

create type public.goal_category as enum ('weight', 'performance', 'training', 'custom');
create type public.goal_status   as enum ('active', 'completed', 'archived');

create table public.athlete_goals (
  id               uuid               primary key default gen_random_uuid(),
  athlete_id       uuid               not null references public.profiles(id) on delete cascade,
  category         public.goal_category not null,
  title            text               not null,
  description      text,
  target_value     text,
  current_value    text,
  status           public.goal_status not null default 'active',
  created_at       timestamptz        not null default now(),
  updated_at       timestamptz        not null default now()
);

create index athlete_goals_athlete_idx
  on public.athlete_goals (athlete_id, status);

alter table public.athlete_goals enable row level security;

-- Athletes full CRUD on their own goals
create policy "Athletes can view own goals"
  on public.athlete_goals for select
  using (auth.uid() = athlete_id);

create policy "Athletes can create own goals"
  on public.athlete_goals for insert
  with check (
    auth.uid() = athlete_id
    and public.current_user_role() = 'ATHLETE'
  );

create policy "Athletes can update own goals"
  on public.athlete_goals for update
  using (auth.uid() = athlete_id)
  with check (auth.uid() = athlete_id);

create policy "Athletes can delete own goals"
  on public.athlete_goals for delete
  using (auth.uid() = athlete_id);

-- Psychologists can read goals for athletes in their caseload
create policy "Psychologists can view assigned athlete goals"
  on public.athlete_goals for select
  using (
    public.current_user_role() = 'PSYCHOLOGIST'
    and exists (
      select 1 from public.psychologist_athletes pa
      where pa.psychologist_id = auth.uid()
        and pa.athlete_id = athlete_goals.athlete_id
    )
  );

-- Auto-update updated_at
create trigger athlete_goals_updated_at
  before update on public.athlete_goals
  for each row execute function public.set_updated_at();
