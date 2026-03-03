-- Audit trail for lead lifecycle events
CREATE TABLE IF NOT EXISTS lead_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups by lead
CREATE INDEX IF NOT EXISTS idx_lead_events_lead_id ON lead_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_events_created_at ON lead_events(created_at DESC);
