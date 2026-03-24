-- ============================================================
-- Anchor: Allow psychologists to create sessions
-- Migration 010: Psychologists can insert sessions for athletes
--   in their caseload (psychologist_athletes assignment).
-- ============================================================

create policy "Psychologists can create sessions for assigned athletes"
  on public.psychologist_sessions for insert
  with check (
    auth.uid() = psychologist_id
    and public.current_user_role() = 'PSYCHOLOGIST'
    and exists (
      select 1 from public.psychologist_athletes pa
      where pa.psychologist_id = auth.uid()
        and pa.athlete_id = psychologist_sessions.athlete_id
    )
  );
