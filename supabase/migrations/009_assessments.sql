-- ============================================================
-- Anchor: Pre-Game Assessments
-- Migration 009: Psychologist-assigned assessments that
--   athletes complete before games/competitions.
-- ============================================================

create type public.assessment_status as enum ('assigned', 'completed');

create table public.assessments (
  id               uuid              primary key default gen_random_uuid(),
  athlete_id       uuid              not null references public.profiles(id) on delete cascade,
  psychologist_id  uuid              not null references public.profiles(id) on delete cascade,
  template_key     text              not null default 'pre_game',
  status           public.assessment_status not null default 'assigned',
  due_at           timestamptz,
  answers          jsonb,
  score            integer,
  created_at       timestamptz       not null default now(),
  updated_at       timestamptz       not null default now()
);

create index assessments_athlete_idx
  on public.assessments (athlete_id, created_at);

create index assessments_psychologist_idx
  on public.assessments (psychologist_id, created_at);

-- Auto-update updated_at
create trigger assessments_updated_at
  before update on public.assessments
  for each row execute procedure public.handle_updated_at();

-- Enable RLS
alter table public.assessments enable row level security;

-- Athletes can view their own assessments
create policy "Athletes can view own assessments"
  on public.assessments for select
  using (auth.uid() = athlete_id);

-- Athletes can update their own assessments (submit answers)
create policy "Athletes can update own assessments"
  on public.assessments for update
  using (auth.uid() = athlete_id)
  with check (auth.uid() = athlete_id);

-- Psychologists can view assessments for assigned athletes
create policy "Psychologists can view assigned athlete assessments"
  on public.assessments for select
  using (
    auth.uid() = psychologist_id
    and public.current_user_role() = 'PSYCHOLOGIST'
  );

-- Psychologists can create assessments for assigned athletes
create policy "Psychologists can create assessments"
  on public.assessments for insert
  with check (
    auth.uid() = psychologist_id
    and public.current_user_role() = 'PSYCHOLOGIST'
    and exists (
      select 1 from public.psychologist_athletes
      where psychologist_id = auth.uid()
      and athlete_id = assessments.athlete_id
    )
  );
