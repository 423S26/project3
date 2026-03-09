-- ============================================================
-- Anchor: Allow psychologists to update sessions they are assigned to
-- Migration 008
-- ============================================================

create policy "Psychologists can update assigned athlete sessions"
  on public.psychologist_sessions for update
  using (
    auth.uid() = psychologist_id
    and public.current_user_role() = 'PSYCHOLOGIST'
  )
  with check (
    auth.uid() = psychologist_id
    and public.current_user_role() = 'PSYCHOLOGIST'
  );
