-- Add email notification preferences to user_profiles
-- Default: all notifications enabled
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS email_preferences JSONB DEFAULT '{
    "new_message": true,
    "new_opportunity": true,
    "submission_received": true,
    "submission_shortlisted": true,
    "submission_rejected": true
  }'::jsonb;

-- Index for efficient querying of email prefs
CREATE INDEX IF NOT EXISTS idx_user_profiles_email_prefs
  ON public.user_profiles USING gin (email_preferences);
