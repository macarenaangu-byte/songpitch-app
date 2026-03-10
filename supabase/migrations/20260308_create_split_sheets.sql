-- ============================================================================
-- SongPitch: Create split_sheets table + tracks storage bucket
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================================

-- 1. split_sheets — stores AI-generated ownership split sheets
CREATE TABLE IF NOT EXISTS public.split_sheets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  song_title text,
  splits jsonb NOT NULL,
  signature text NOT NULL,
  attested boolean NOT NULL DEFAULT false,
  track_path text,
  input_method text,
  transcription text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_split_sheets_user ON public.split_sheets(user_id);

-- 2. RLS policies
ALTER TABLE public.split_sheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "split_sheets: users see own"
  ON public.split_sheets FOR SELECT
  USING (user_id = public.get_my_profile_id());

CREATE POLICY "split_sheets: users can insert own"
  ON public.split_sheets FOR INSERT
  WITH CHECK (user_id = public.get_my_profile_id());

CREATE POLICY "split_sheets: users can update own"
  ON public.split_sheets FOR UPDATE
  USING (user_id = public.get_my_profile_id());

CREATE POLICY "split_sheets: users can delete own"
  ON public.split_sheets FOR DELETE
  USING (user_id = public.get_my_profile_id());

-- 3. Storage bucket for track uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('tracks', 'tracks', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "tracks: authenticated users can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'tracks' AND auth.role() = 'authenticated');

CREATE POLICY "tracks: users can read own tracks"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'tracks' AND auth.role() = 'authenticated');

CREATE POLICY "tracks: users can delete own tracks"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'tracks' AND auth.role() = 'authenticated');
