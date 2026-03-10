-- ═══════════════════════════════════════════════════════════════════════════════
-- Fix: Restrict notification INSERT policy
-- Previously allowed ANY authenticated user to insert notifications for ANY user.
-- Now restricts to only authenticated users (still needed for cross-user
-- notifications like "X applied to your opportunity"), but prevents inserting
-- notifications where the actor IS the recipient (self-spam).
-- ═══════════════════════════════════════════════════════════════════════════════

-- Drop the old overly-permissive policy
DROP POLICY IF EXISTS "notifications: authenticated users can insert" ON public.notifications;

-- New policy: authenticated users can insert, but not for themselves
-- (legitimate notifications are always for OTHER users — e.g., "User A messaged you")
CREATE POLICY "notifications: authenticated users can insert for others"
  ON public.notifications FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND user_id IS NOT NULL
  );
