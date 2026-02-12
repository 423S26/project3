-- ============================================================
-- Anchor: Supabase Postgres schema
-- Run this in the Supabase SQL Editor (or via supabase db push)
-- ============================================================

-- ─── Tables ──────────────────────────────────────────────────

-- Profiles table (linked 1:1 to Supabase Auth users)
create table public.profiles (
  id         uuid        primary key references auth.users(id) on delete cascade,
  email      text        not null unique,
  name       text        not null,
  role       text        not null default 'ATHLETE'
                         check (role in ('ATHLETE', 'PSYCHOLOGIST')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Athlete-specific profile data
create table public.athlete_profiles (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null unique references public.profiles(id) on delete cascade,
  sport      text,
  position   text,
  team       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Daily check-ins
create table public.check_ins (
  id                   uuid        primary key default gen_random_uuid(),
  athlete_id           uuid        not null references public.profiles(id) on delete cascade,
  created_at           timestamptz not null default now(),
  mood                 integer     not null check (mood between 1 and 10),
  stress               integer     not null check (stress between 1 and 10),
  motivation           integer     not null check (motivation between 1 and 10),
  notes                text,
  brums_json           jsonb,
  brums_subscales_json jsonb
);

-- ─── Indexes ─────────────────────────────────────────────────

create index check_ins_athlete_created_idx
  on public.check_ins (athlete_id, created_at);

-- ─── Auto-update updated_at trigger ─────────────────────────

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger athlete_profiles_updated_at
  before update on public.athlete_profiles
  for each row execute procedure public.handle_updated_at();

-- ─── Auto-create profile on signup trigger ──────────────────

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', 'User'),
    coalesce(new.raw_user_meta_data->>'role', 'ATHLETE')
  );

  -- If athlete, also create an athlete_profile row
  if coalesce(new.raw_user_meta_data->>'role', 'ATHLETE') = 'ATHLETE' then
    insert into public.athlete_profiles (user_id)
    values (new.id);
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Helper: look up current user's role ────────────────────

create or replace function public.current_user_role()
returns text as $$
  select role from public.profiles where id = auth.uid();
$$ language sql security definer stable;

-- ─── Row Level Security ─────────────────────────────────────

alter table public.profiles          enable row level security;
alter table public.athlete_profiles  enable row level security;
alter table public.check_ins         enable row level security;

-- profiles -------------------------------------------------

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Psychologists can view all profiles"
  on public.profiles for select
  using (public.current_user_role() = 'PSYCHOLOGIST');

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- athlete_profiles -----------------------------------------

create policy "Users can view own athlete profile"
  on public.athlete_profiles for select
  using (auth.uid() = user_id);

create policy "Psychologists can view all athlete profiles"
  on public.athlete_profiles for select
  using (public.current_user_role() = 'PSYCHOLOGIST');

create policy "Users can update own athlete profile"
  on public.athlete_profiles for update
  using (auth.uid() = user_id);

-- check_ins ------------------------------------------------

create policy "Athletes can view own check-ins"
  on public.check_ins for select
  using (auth.uid() = athlete_id);

create policy "Psychologists can view all check-ins"
  on public.check_ins for select
  using (public.current_user_role() = 'PSYCHOLOGIST');

create policy "Athletes can insert own check-ins"
  on public.check_ins for insert
  with check (auth.uid() = athlete_id);

create policy "Psychologists can insert check-ins"
  on public.check_ins for insert
  with check (public.current_user_role() = 'PSYCHOLOGIST');
