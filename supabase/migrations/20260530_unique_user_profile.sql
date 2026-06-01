-- Migration: Add UNIQUE constraint on user_profiles.user_id
-- This is required for the AccountSetupPage upsert (ON CONFLICT user_id) to work.
-- Also deduplicates any existing duplicate profile rows, keeping the most recent one.

-- Step 1: Remove duplicate rows, keep only the most recent profile per user_id
DELETE FROM user_profiles
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM user_profiles
  ORDER BY user_id, created_at DESC NULLS LAST
);

-- Step 2: Add the unique constraint
ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_user_id_unique UNIQUE (user_id);
