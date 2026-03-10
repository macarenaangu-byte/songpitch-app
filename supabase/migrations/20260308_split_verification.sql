-- Split Verification: Link split sheets to songs + add verification tracking
-- Run AFTER 20260308_create_split_sheets.sql

-- 1. Add song_id FK to split_sheets (links split sheets to specific songs)
ALTER TABLE public.split_sheets
  ADD COLUMN IF NOT EXISTS song_id uuid REFERENCES public.songs(id) ON DELETE SET NULL;

-- 2. Add verification_status to songs
ALTER TABLE public.songs
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'unverified';

-- 3. Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_split_sheets_song_id ON public.split_sheets(song_id);
CREATE INDEX IF NOT EXISTS idx_songs_verification_status ON public.songs(verification_status);

-- 4. Auto-verify One-Stop songs (they own 100% of everything)
UPDATE public.songs SET verification_status = 'verified' WHERE is_one_stop = true;

-- 5. Mark Co-Owned songs (not one-stop) as pending verification
UPDATE public.songs SET verification_status = 'pending_splits'
  WHERE is_one_stop = false AND verification_status = 'unverified';
