-- ══════════════════════════════════════════════════
-- 002: Leads Table
-- ══════════════════════════════════════════════════

CREATE TYPE lead_status AS ENUM (
  'new', 'contacted', 'in_progress', 'closed_won', 'closed_lost'
);

CREATE TYPE lead_source AS ENUM (
  'landing', 'telegram', 'direct', 'manual'
);

CREATE TABLE leads (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone           text NOT NULL,
  name            text,
  complex_id      uuid REFERENCES complexes(id) ON DELETE SET NULL,
  area_sqm        numeric(8,2),
  floor           integer,
  estimated_price bigint,
  status          lead_status NOT NULL DEFAULT 'new',
  source          lead_source NOT NULL DEFAULT 'landing',
  broker_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes           text,
  property_type   text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  contacted_at    timestamptz
);

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes
CREATE INDEX idx_leads_status ON leads (status);
CREATE INDEX idx_leads_phone ON leads (phone);
CREATE INDEX idx_leads_created ON leads (created_at DESC);
CREATE INDEX idx_leads_broker ON leads (broker_id);
