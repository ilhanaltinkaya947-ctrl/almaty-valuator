-- ══════════════════════════════════════════════════
-- 018: ERP Core Architecture — AlmaVykup OS
--
-- Client/Deal separation, document management,
-- extended pipeline statuses, employee profiles.
-- ══════════════════════════════════════════════════

-- ── 1. Extend lead_status ENUM ──

ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'awaiting_payout' AFTER 'deal_progress';
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'deal_closed' AFTER 'awaiting_payout';

-- ── 2. Clients table (separate entity from leads/deals) ──

CREATE TABLE IF NOT EXISTS clients (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone      text UNIQUE NOT NULL,
  full_name  text,
  iin        text,
  tags       text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients (phone);
CREATE INDEX IF NOT EXISTS idx_clients_iin ON clients (iin) WHERE iin IS NOT NULL;

-- ── 3. Update leads table (now = Deals) ──

-- Link deals to clients
ALTER TABLE leads ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_leads_client_id ON leads (client_id);

-- Auto-incrementing short ID for human-readable deal numbers
-- Using a separate sequence since GENERATED ALWAYS AS IDENTITY requires column creation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'short_id'
  ) THEN
    CREATE SEQUENCE leads_short_id_seq START WITH 100;
    ALTER TABLE leads ADD COLUMN short_id integer NOT NULL DEFAULT nextval('leads_short_id_seq');
    -- Backfill existing rows
    UPDATE leads SET short_id = nextval('leads_short_id_seq') WHERE short_id = 100;
  END IF;
END $$;

-- Rejection reason for rejected deals
ALTER TABLE leads ADD COLUMN IF NOT EXISTS rejection_reason text;

-- ── 4. Update profiles table (employees) ──

-- Add text-based role for more flexible role assignment
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role_text'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role_text text;
  END IF;
END $$;

-- Telegram chat ID for direct notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'telegram_chat_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN telegram_chat_id text UNIQUE;
  END IF;
END $$;

-- ── 5. Lead Attachments (ЭДО — document management) ──

CREATE TABLE IF NOT EXISTS lead_attachments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  file_url    text NOT NULL,
  file_type   text NOT NULL,
  file_name   text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_attachments_lead_id ON lead_attachments (lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_attachments_uploaded_by ON lead_attachments (uploaded_by);

-- ── 6. RLS Policies ──

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY clients_select ON clients
  FOR SELECT TO authenticated USING (true);

CREATE POLICY clients_insert ON clients
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY clients_update ON clients
  FOR UPDATE TO authenticated USING (true);

ALTER TABLE lead_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY lead_attachments_select ON lead_attachments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY lead_attachments_insert ON lead_attachments
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY lead_attachments_update ON lead_attachments
  FOR UPDATE TO authenticated USING (true);

-- ── 7. Auto-link existing leads to clients by phone ──

-- Create clients from existing unique phones
INSERT INTO clients (phone, full_name)
SELECT DISTINCT ON (phone) phone, name
FROM leads
WHERE phone IS NOT NULL
ON CONFLICT (phone) DO NOTHING;

-- Link leads to their clients
UPDATE leads
SET client_id = c.id
FROM clients c
WHERE leads.phone = c.phone
  AND leads.client_id IS NULL;
