-- ══════════════════════════════════════════════════
-- 028: Sales role + post-buyout sales pipeline
--
-- Adds: sales role, sales pipeline statuses
-- Pipeline: deal_closed → ready_for_sale → on_viewing →
--   deposit_received → sale_in_progress → sold
-- ══════════════════════════════════════════════════

-- ── 1. Add 'sales' to role enums ──
ALTER TYPE agent_role ADD VALUE IF NOT EXISTS 'sales';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'sales';

-- ── 2. Add sales pipeline statuses to lead_status enum ──
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'ready_for_sale';
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'on_viewing';
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'deposit_received';
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'sale_in_progress';
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'sold';

-- ── 3. RLS policy for sales role — see only sales-pipeline leads ──
DROP POLICY IF EXISTS "leads_sales_select" ON leads;
CREATE POLICY "leads_sales_select" ON leads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'sales'
    )
    AND status IN ('ready_for_sale', 'on_viewing', 'deposit_received', 'sale_in_progress')
  );
