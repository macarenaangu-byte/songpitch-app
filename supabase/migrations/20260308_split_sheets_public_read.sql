-- Fix: Allow any authenticated user to read split sheets
-- The existing "split_sheets: users see own" policy only allows owners to read their records.
-- Executives need to read split sheets via the "View Verified Rights" modal.
-- Supabase evaluates SELECT policies with OR logic, so this new policy grants
-- read access to all authenticated users without breaking the existing owner policy.

CREATE POLICY "split_sheets: authenticated users can read all"
  ON public.split_sheets FOR SELECT
  USING (auth.role() = 'authenticated');
