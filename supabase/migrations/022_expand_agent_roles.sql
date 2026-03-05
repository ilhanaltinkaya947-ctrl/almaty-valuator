-- Expand agent_role enum to include jurist, director, cashier
ALTER TYPE agent_role ADD VALUE IF NOT EXISTS 'jurist';
ALTER TYPE agent_role ADD VALUE IF NOT EXISTS 'director';
ALTER TYPE agent_role ADD VALUE IF NOT EXISTS 'cashier';

-- RLS policies for leads table based on role
-- Drop existing lead policies and recreate with role-based access

-- Policy: Admins can see all leads
DROP POLICY IF EXISTS "leads_admin_select" ON leads;
CREATE POLICY "leads_admin_select" ON leads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Brokers see new leads + their own assigned leads
DROP POLICY IF EXISTS "leads_broker_select" ON leads;
CREATE POLICY "leads_broker_select" ON leads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
    AND (status = 'new' OR assigned_to = auth.uid())
  );

-- Policy: Jurists see price_approved leads
DROP POLICY IF EXISTS "leads_jurist_select" ON leads;
CREATE POLICY "leads_jurist_select" ON leads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'jurist'
    )
    AND status = 'price_approved'
  );

-- Policy: Directors see jurist_approved + director_approved leads
DROP POLICY IF EXISTS "leads_director_select" ON leads;
CREATE POLICY "leads_director_select" ON leads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'director'
    )
    AND status IN ('jurist_approved', 'director_approved')
  );

-- Policy: Cashiers see awaiting_payout leads only
DROP POLICY IF EXISTS "leads_cashier_select" ON leads;
CREATE POLICY "leads_cashier_select" ON leads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'cashier'
    )
    AND status = 'awaiting_payout'
  );
