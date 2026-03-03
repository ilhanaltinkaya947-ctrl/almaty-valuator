-- ══════════════════════════════════════════════════
-- 010: Krisha.kz Market Data Snapshots
-- ══════════════════════════════════════════════════

CREATE TABLE krisha_snapshots (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complex_id      uuid NOT NULL REFERENCES complexes(id) ON DELETE CASCADE,
  avg_price_sqm   integer NOT NULL,
  median_price_sqm integer,
  min_price_sqm   integer,
  max_price_sqm   integer,
  listing_count   integer NOT NULL DEFAULT 0,
  scraped_at      timestamptz NOT NULL DEFAULT now()
);

-- Index for querying latest snapshot per complex
CREATE INDEX idx_snapshots_complex_date ON krisha_snapshots (complex_id, scraped_at DESC);

-- Index for time-series queries
CREATE INDEX idx_snapshots_scraped_at ON krisha_snapshots (scraped_at);

-- RLS
ALTER TABLE krisha_snapshots ENABLE ROW LEVEL SECURITY;

-- Public read (for CRM dashboards)
CREATE POLICY "snapshots_public_read"
  ON krisha_snapshots FOR SELECT
  USING (true);

-- Service-role write (automation only)
CREATE POLICY "snapshots_service_write"
  ON krisha_snapshots FOR INSERT
  WITH CHECK (true);

-- Add krisha_complex_id to complexes table (krisha.kz internal ID for URL building)
ALTER TABLE complexes ADD COLUMN IF NOT EXISTS krisha_complex_id integer;
