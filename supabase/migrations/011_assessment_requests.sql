-- ============================================================
-- Anchor: Assessment Requests
-- Migration 011: Allow athletes to request assessments from
--   their assigned psychologist via a boolean flag.
--   No enum modification needed.
-- ============================================================

-- Add athlete_requested flag (safe ADD COLUMN, no enum change)
ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS athlete_requested BOOLEAN NOT NULL DEFAULT false;

-- Athletes can INSERT an assessment request
-- (status must be 'assigned', flag must be true, psychologist must be their assigned one)
CREATE POLICY "Athletes can request assessments"
  ON public.assessments FOR INSERT
  WITH CHECK (
    auth.uid() = athlete_id
    AND status = 'assigned'
    AND athlete_requested = true
    AND public.current_user_role() = 'ATHLETE'
    AND EXISTS (
      SELECT 1 FROM public.psychologist_athletes
      WHERE athlete_id = auth.uid()
        AND psychologist_id = assessments.psychologist_id
    )
  );

-- Psychologists can update assessments for their assigned athletes
CREATE POLICY "Psychologists can update assigned athlete assessments"
  ON public.assessments FOR UPDATE
  USING (
    auth.uid() = psychologist_id
    AND public.current_user_role() = 'PSYCHOLOGIST'
  )
  WITH CHECK (
    auth.uid() = psychologist_id
    AND public.current_user_role() = 'PSYCHOLOGIST'
  );

-- Athletes can delete their own athlete_requested assessments (cancel)
CREATE POLICY "Athletes can cancel own assessment requests"
  ON public.assessments FOR DELETE
  USING (
    auth.uid() = athlete_id
    AND athlete_requested = true
  );
