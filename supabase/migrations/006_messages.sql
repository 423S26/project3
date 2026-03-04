-- ============================================================
-- Anchor: Messaging between Psychologists and Athletes
-- Migration 006: message_threads, messages, message_thread_reads
-- ============================================================

-- ─── Message Threads ────────────────────────────────────────
-- One thread per psychologist-athlete pair.

create table public.message_threads (
  id               uuid        primary key default gen_random_uuid(),
  psychologist_id  uuid        not null references public.profiles(id) on delete cascade,
  athlete_id       uuid        not null references public.profiles(id) on delete cascade,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint message_threads_pair_unique unique (psychologist_id, athlete_id)
);

create index message_threads_psychologist_idx on public.message_threads (psychologist_id);
create index message_threads_athlete_idx     on public.message_threads (athlete_id);

alter table public.message_threads enable row level security;

-- Either participant can view their threads
create policy "Participants can view own threads"
  on public.message_threads for select
  using (auth.uid() = psychologist_id or auth.uid() = athlete_id);

-- Only allow thread creation if the pair exists in psychologist_athletes
create policy "Participants can create threads for valid assignments"
  on public.message_threads for insert
  with check (
    (auth.uid() = psychologist_id or auth.uid() = athlete_id)
    and exists (
      select 1 from public.psychologist_athletes pa
      where pa.psychologist_id = message_threads.psychologist_id
      and pa.athlete_id = message_threads.athlete_id
    )
  );

create trigger message_threads_updated_at
  before update on public.message_threads
  for each row execute procedure public.handle_updated_at();

-- ─── Messages ───────────────────────────────────────────────

create table public.messages (
  id         uuid        primary key default gen_random_uuid(),
  thread_id  uuid        not null references public.message_threads(id) on delete cascade,
  sender_id  uuid        not null references public.profiles(id) on delete cascade,
  body       text        not null,
  created_at timestamptz not null default now()
);

create index messages_thread_created_idx on public.messages (thread_id, created_at);

alter table public.messages enable row level security;

-- Participants can view messages in their threads
create policy "Participants can view thread messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.message_threads t
      where t.id = messages.thread_id
      and (t.psychologist_id = auth.uid() or t.athlete_id = auth.uid())
    )
  );

-- Only a thread participant can insert, and sender_id must be themselves
create policy "Participants can send messages"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.message_threads t
      where t.id = messages.thread_id
      and (t.psychologist_id = auth.uid() or t.athlete_id = auth.uid())
    )
  );

-- ─── Read Tracking ──────────────────────────────────────────
-- Tracks when each user last read a thread for unread counts.

create table public.message_thread_reads (
  thread_id    uuid        not null references public.message_threads(id) on delete cascade,
  user_id      uuid        not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz not null default now(),

  primary key (thread_id, user_id)
);

alter table public.message_thread_reads enable row level security;

-- Users can manage their own read tracking
create policy "Users can view own read tracking"
  on public.message_thread_reads for select
  using (auth.uid() = user_id);

create policy "Users can upsert own read tracking"
  on public.message_thread_reads for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.message_threads t
      where t.id = message_thread_reads.thread_id
      and (t.psychologist_id = auth.uid() or t.athlete_id = auth.uid())
    )
  );

create policy "Users can update own read tracking"
  on public.message_thread_reads for update
  using (auth.uid() = user_id);

-- ─── Enable Realtime ────────────────────────────────────────
-- Allow clients to subscribe to new messages via Supabase Realtime.

alter publication supabase_realtime add table public.messages;
