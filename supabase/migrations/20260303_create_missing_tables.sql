-- ============================================================================
-- SongPitch: Create missing tables
-- Run this FIRST in Supabase SQL Editor, THEN re-run 20260302_add_rls_policies.sql
-- ============================================================================

-- 1. viewed_opportunities — tracks which opportunities a composer has seen (for badge counts)
CREATE TABLE IF NOT EXISTS public.viewed_opportunities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, opportunity_id)
);

-- 2. pinned_chats — lets users pin conversations to the top of their messages list
CREATE TABLE IF NOT EXISTS public.pinned_chats (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  pinned_user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, pinned_user_id)
);

-- 3. profile_views — tracks who viewed whose profile (for composer stats)
CREATE TABLE IF NOT EXISTS public.profile_views (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  viewed_user_id uuid NOT NULL,
  viewer_user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_viewed_opportunities_user ON public.viewed_opportunities(user_id);
CREATE INDEX IF NOT EXISTS idx_pinned_chats_user ON public.pinned_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed ON public.profile_views(viewed_user_id);
