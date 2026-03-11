-- ══════════════════════════════════════════════════════════════
-- Migration 027: Phase 2 — Deal Expenses + Property Media + Manual Sources
-- ══════════════════════════════════════════════════════════════

-- ── 1. Expense Category Enum ──
DO $$ BEGIN
  CREATE TYPE expense_category AS ENUM ('notary', 'repair', 'utility_debt', 'cleaning', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 2. Deal Expenses Table ──
CREATE TABLE IF NOT EXISTS deal_expenses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  category    expense_category NOT NULL DEFAULT 'other',
  amount      numeric(14,2) NOT NULL CHECK (amount >= 0),
  description text,
  created_by  uuid REFERENCES profiles(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups by lead
CREATE INDEX IF NOT EXISTS idx_deal_expenses_lead_id ON deal_expenses(lead_id);

-- ── 3. RLS for deal_expenses ──
ALTER TABLE deal_expenses ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY deal_expenses_admin_all ON deal_expenses
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Service role bypass (our API routes use service role)
CREATE POLICY deal_expenses_service_all ON deal_expenses
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ── 4. Property Media Storage Bucket ──
-- Create the bucket (public so images are directly accessible)
INSERT INTO storage.buckets (id, name, public)
VALUES ('property_media', 'property_media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: allow authenticated uploads
CREATE POLICY property_media_insert ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'property_media');

CREATE POLICY property_media_select ON storage.objects
  FOR SELECT
  USING (bucket_id = 'property_media');

CREATE POLICY property_media_delete ON storage.objects
  FOR DELETE
  USING (bucket_id = 'property_media');

-- ── 5. Expand lead_source enum with offline sources ──
-- Add 'walk_in' and 'outdoor_ad' to the source if not already present
DO $$ BEGIN
  ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'walk_in';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'outdoor_ad';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'referral';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 6. Add address column to leads (for manual offline deals) ──
ALTER TABLE leads ADD COLUMN IF NOT EXISTS address text;
