-- ============================================================================
-- SongPitch: Subscription Tiers + Stripe Integration
-- Run in Supabase SQL Editor
-- ============================================================================

-- ── 1. Add subscription fields to user_profiles ──────────────────────────────
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS subscription_tier       TEXT    NOT NULL DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'basic', 'pro', 'admin')),

  -- Stripe
  ADD COLUMN IF NOT EXISTS stripe_customer_id      TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id  TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status     TEXT    DEFAULT 'active',  -- active | canceled | past_due
  ADD COLUMN IF NOT EXISTS subscription_ends_at    TIMESTAMPTZ,               -- when current period ends

  -- Composer usage counters
  ADD COLUMN IF NOT EXISTS uploads_this_week       INT     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS uploads_week_reset      DATE    DEFAULT CURRENT_DATE,

  -- Shared monthly counters (composer + executive)
  ADD COLUMN IF NOT EXISTS contacts_this_month         INT  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS opportunities_this_month    INT  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS contract_revisions_this_month INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_reset_date          DATE DEFAULT date_trunc('month', CURRENT_DATE)::DATE;

-- ── 2. Set your admin account to unlimited tier ───────────────────────────────
-- Replace with your actual email
UPDATE public.user_profiles
SET subscription_tier = 'admin'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'mangulo@songpitchhub.com'
);

-- ── 3. Tier limits reference table (single source of truth) ──────────────────
CREATE TABLE IF NOT EXISTS public.tier_limits (
  tier                     TEXT PRIMARY KEY,
  -- Composer
  uploads_per_week         INT,   -- NULL = unlimited
  -- Shared
  contacts_per_month       INT,   -- NULL = unlimited
  opportunities_per_month  INT,   -- NULL = unlimited
  -- Executive
  contract_revisions_per_month INT, -- NULL = unlimited
  shortlists_max           INT,   -- NULL = unlimited
  -- Feature flags (true = enabled)
  full_split_analysis      BOOLEAN NOT NULL DEFAULT false,
  deal_analyzer            BOOLEAN NOT NULL DEFAULT false,
  agreement_reader         BOOLEAN NOT NULL DEFAULT false,
  pro_ipi_enrichment       BOOLEAN NOT NULL DEFAULT false,
  advanced_filters         BOOLEAN NOT NULL DEFAULT false,
  export_split_sheet       BOOLEAN NOT NULL DEFAULT false,
  market_analytics         BOOLEAN NOT NULL DEFAULT false,
  contract_revision        BOOLEAN NOT NULL DEFAULT false,
  contract_vault           BOOLEAN NOT NULL DEFAULT false,
  verified_badge_visible   BOOLEAN NOT NULL DEFAULT true
);

-- ── 4. Seed tier limits ───────────────────────────────────────────────────────
INSERT INTO public.tier_limits (
  tier,
  uploads_per_week,
  contacts_per_month,
  opportunities_per_month,
  contract_revisions_per_month,
  shortlists_max,
  full_split_analysis,
  deal_analyzer,
  agreement_reader,
  pro_ipi_enrichment,
  advanced_filters,
  export_split_sheet,
  market_analytics,
  contract_revision,
  contract_vault,
  verified_badge_visible
) VALUES
-- Free tier
('free',  3,    5,   3,  0,  0,
  false, false, false, false, false, false, false, false, false, true),
-- Basic tier
('basic', NULL, 25, 10,  3,  5,
  true,  false, false, true,  true,  false, false, true,  true,  true),
-- Pro tier
('pro',   NULL, NULL, NULL, NULL, NULL,
  true,  true,  true,  true,  true,  true,  true,  true,  true,  true),
-- Admin (unlimited everything)
('admin', NULL, NULL, NULL, NULL, NULL,
  true,  true,  true,  true,  true,  true,  true,  true,  true,  true)
ON CONFLICT (tier) DO UPDATE SET
  uploads_per_week             = EXCLUDED.uploads_per_week,
  contacts_per_month           = EXCLUDED.contacts_per_month,
  opportunities_per_month      = EXCLUDED.opportunities_per_month,
  contract_revisions_per_month = EXCLUDED.contract_revisions_per_month,
  shortlists_max               = EXCLUDED.shortlists_max,
  full_split_analysis          = EXCLUDED.full_split_analysis,
  deal_analyzer                = EXCLUDED.deal_analyzer,
  agreement_reader             = EXCLUDED.agreement_reader,
  pro_ipi_enrichment           = EXCLUDED.pro_ipi_enrichment,
  advanced_filters             = EXCLUDED.advanced_filters,
  export_split_sheet           = EXCLUDED.export_split_sheet,
  market_analytics             = EXCLUDED.market_analytics,
  contract_revision            = EXCLUDED.contract_revision,
  contract_vault               = EXCLUDED.contract_vault,
  verified_badge_visible       = EXCLUDED.verified_badge_visible;

-- ── 5. Helper function: check if a user is within their usage limit ───────────
CREATE OR REPLACE FUNCTION public.check_usage_limit(
  p_user_id    UUID,
  p_action     TEXT  -- 'upload' | 'contact' | 'opportunity' | 'contract_revision'
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_profile   RECORD;
  v_limits    RECORD;
  v_allowed   BOOLEAN := true;
  v_used      INT := 0;
  v_max       INT := NULL;
BEGIN
  SELECT up.*, tl.*
  INTO v_profile
  FROM public.user_profiles up
  JOIN public.tier_limits tl ON tl.tier = up.subscription_tier
  WHERE up.id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Profile not found');
  END IF;

  -- Admin / pro with NULL limits always allowed
  IF p_action = 'upload' THEN
    v_used := v_profile.uploads_this_week;
    v_max  := v_profile.uploads_per_week;
  ELSIF p_action = 'contact' THEN
    v_used := v_profile.contacts_this_month;
    v_max  := v_profile.contacts_per_month;
  ELSIF p_action = 'opportunity' THEN
    v_used := v_profile.opportunities_this_month;
    v_max  := v_profile.opportunities_per_month;
  ELSIF p_action = 'contract_revision' THEN
    v_used := v_profile.contract_revisions_this_month;
    v_max  := v_profile.contract_revisions_per_month;
  END IF;

  IF v_max IS NULL THEN
    v_allowed := true;  -- unlimited
  ELSIF v_used >= v_max THEN
    v_allowed := false;
  END IF;

  RETURN jsonb_build_object(
    'allowed',    v_allowed,
    'used',       v_used,
    'max',        v_max,
    'tier',       v_profile.subscription_tier
  );
END;
$$;

-- ── 6. Helper function: increment a usage counter ────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_usage(
  p_user_id  UUID,
  p_action   TEXT  -- 'upload' | 'contact' | 'opportunity' | 'contract_revision'
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_action = 'upload' THEN
    UPDATE public.user_profiles
    SET uploads_this_week = uploads_this_week + 1
    WHERE id = p_user_id;
  ELSIF p_action = 'contact' THEN
    UPDATE public.user_profiles
    SET contacts_this_month = contacts_this_month + 1
    WHERE id = p_user_id;
  ELSIF p_action = 'opportunity' THEN
    UPDATE public.user_profiles
    SET opportunities_this_month = opportunities_this_month + 1
    WHERE id = p_user_id;
  ELSIF p_action = 'contract_revision' THEN
    UPDATE public.user_profiles
    SET contract_revisions_this_month = contract_revisions_this_month + 1
    WHERE id = p_user_id;
  END IF;
END;
$$;

-- ── 7. RLS: tier_limits is public read ───────────────────────────────────────
ALTER TABLE public.tier_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tier_limits: public read"
  ON public.tier_limits FOR SELECT
  USING (true);

-- ── 8. Index for Stripe lookups ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer
  ON public.user_profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_tier
  ON public.user_profiles(subscription_tier);
