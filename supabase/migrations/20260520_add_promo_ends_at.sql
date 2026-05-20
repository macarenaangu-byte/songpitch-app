-- Add promo_ends_at to user_profiles
-- Stores the date when a promotional discount expires on the user's Stripe subscription.
-- Populated by the stripe-webhook function when a discount is detected.
-- NULL = no active promo / regular billing.

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS promo_ends_at TIMESTAMPTZ;
