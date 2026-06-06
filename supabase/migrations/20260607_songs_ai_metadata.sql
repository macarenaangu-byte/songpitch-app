-- Migration: Add new SongAnalyzer AI metadata fields to songs table
ALTER TABLE songs
  ADD COLUMN IF NOT EXISTS tertiary_genre   text,
  ADD COLUMN IF NOT EXISTS mood_tags        text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS vocals           text,
  ADD COLUMN IF NOT EXISTS use_cases        text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS instruments      text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tempo            text,
  ADD COLUMN IF NOT EXISTS time_signature   text,
  ADD COLUMN IF NOT EXISTS energy           integer,
  ADD COLUMN IF NOT EXISTS loudness_lufs    numeric(6,2),
  ADD COLUMN IF NOT EXISTS loudness_note    text;
