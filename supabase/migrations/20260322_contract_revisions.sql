-- ── contract_revisions table ──────────────────────────────────────────────────
-- Stores Contract Vault entries for executive users.
-- Each row is one analyzed contract saved by a music executive.

CREATE TABLE IF NOT EXISTS contract_revisions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contract_name   TEXT        NOT NULL,
  contract_type   TEXT        NOT NULL DEFAULT 'revision', -- 'revision' | 'deal' | 'agreement'
  analysis        JSONB       NOT NULL DEFAULT '{}',
  fairness        TEXT,       -- 'creator_unfavorable' | 'below_standard' | 'standard' | 'above_standard' | 'creator_favorable'
  summary         TEXT,
  red_flags       JSONB       NOT NULL DEFAULT '[]',
  green_flags     JSONB       NOT NULL DEFAULT '[]',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_contract_revisions_user_id   ON contract_revisions(user_id);
CREATE INDEX IF NOT EXISTS idx_contract_revisions_created_at ON contract_revisions(created_at DESC);

-- ── RLS ────────────────────────────────────────────────────────────────────────
ALTER TABLE contract_revisions ENABLE ROW LEVEL SECURITY;

-- Users can only see and manage their own revisions
CREATE POLICY "Users can view own revisions"
  ON contract_revisions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own revisions"
  ON contract_revisions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own revisions"
  ON contract_revisions FOR DELETE
  USING (auth.uid() = user_id);

-- ── Auto-update updated_at ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_contract_revisions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_contract_revisions_updated_at
  BEFORE UPDATE ON contract_revisions
  FOR EACH ROW EXECUTE FUNCTION update_contract_revisions_updated_at();
