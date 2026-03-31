-- ============================================================
-- Anchor: Psychologist Profiles
-- Migration 012: Structured professional/contact information
--   for psychologists (school, degrees, certifications, contact).
-- ============================================================

create table public.psychologist_profiles (
  user_id          uuid           primary key references public.profiles(id) on delete cascade,
  school           text,
  degree           text,
  certifications   text,
  phone            text,
  office_location  text,
  bio              text,
  created_at       timestamptz    not null default now(),
  updated_at       timestamptz    not null default now()
);

alter table public.psychologist_profiles enable row level security;

-- Psychologists can read and write their own profile
create policy "Psychologists can view own profile"
  on public.psychologist_profiles for select
  using (auth.uid() = user_id);

create policy "Psychologists can insert own profile"
  on public.psychologist_profiles for insert
  with check (
    auth.uid() = user_id
    and public.current_user_role() = 'PSYCHOLOGIST'
  );

create policy "Psychologists can update own profile"
  on public.psychologist_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Athletes can view psychologist profiles (for seeing their assigned psychologist info)
create policy "Athletes can view psychologist profiles"
  on public.psychologist_profiles for select
  using (
    public.current_user_role() = 'ATHLETE'
    and exists (
      select 1 from public.psychologist_athletes pa
      where pa.psychologist_id = psychologist_profiles.user_id
        and pa.athlete_id = auth.uid()
    )
  );

-- Auto-update updated_at
create trigger psychologist_profiles_updated_at
  before update on public.psychologist_profiles
  for each row execute function public.set_updated_at();
