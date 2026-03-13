-- ============================================================================
-- Migration 00009: Platform Integrations (Google Business, Yelp)
-- ============================================================================
-- Stores third-party integration credentials and sync state.
-- Credentials column is JSONB — values should be encrypted at app layer.
-- ============================================================================

-- 1. Add new review source values -----------------------------------------
-- Postgres enums are immutable in older versions, but since our app uses
-- text columns (not native enums), no ALTER TYPE is needed.

-- 2. Integrations table ----------------------------------------------------
CREATE TABLE IF NOT EXISTS integrations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider        text NOT NULL CHECK (provider IN ('google_business', 'yelp')),
  label           text NOT NULL DEFAULT '',
  credentials     jsonb NOT NULL DEFAULT '{}',
  location_id     uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  status          text NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'paused', 'error', 'disconnected')),
  last_synced_at  timestamptz,
  review_count    integer NOT NULL DEFAULT 0,
  auto_import     boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  -- One integration per provider per location
  UNIQUE (organization_id, provider, location_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_integrations_org
  ON integrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_integrations_auto
  ON integrations(auto_import) WHERE auto_import = true AND status = 'active';

-- RLS -----------------------------------------------------------------------
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Org members can view their own integrations
CREATE POLICY "Org members can view integrations"
  ON integrations FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Org members can insert integrations
CREATE POLICY "Org members can insert integrations"
  ON integrations FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Org members can update their own integrations
CREATE POLICY "Org members can update integrations"
  ON integrations FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Org members can delete their own integrations
CREATE POLICY "Org members can delete integrations"
  ON integrations FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Updated_at trigger (reuse the existing function) -------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_updated_at') THEN
    CREATE TRIGGER set_integrations_updated_at
      BEFORE UPDATE ON integrations
      FOR EACH ROW
      EXECUTE FUNCTION handle_updated_at();
  END IF;
END
$$;
