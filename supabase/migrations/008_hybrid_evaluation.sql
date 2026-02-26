-- ══════════════════════════════════════
-- 008: Hybrid Evaluation Model
-- ══════════════════════════════════════

-- Add pending_review status for manual evaluation leads
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'pending_review' AFTER 'new';

-- Add offer_price column for broker manual pricing
ALTER TABLE leads ADD COLUMN IF NOT EXISTS offer_price bigint;

-- Add needs_manual_review flag
ALTER TABLE leads ADD COLUMN IF NOT EXISTS needs_manual_review boolean NOT NULL DEFAULT false;

-- Index for pending reviews (broker dashboard)
CREATE INDEX IF NOT EXISTS idx_leads_pending_review
  ON leads (needs_manual_review, status)
  WHERE needs_manual_review = true;
