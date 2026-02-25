-- ══════════════════════════════════════════════════
-- 005: Row Level Security Policies
-- ══════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE complexes ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;

-- ── complexes: public read, admin write ──
CREATE POLICY "complexes_public_read"
  ON complexes FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "complexes_admin_write"
  ON complexes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data ->> 'role' = 'admin'
    )
  );

-- ── leads: brokers see own, admin sees all ──
CREATE POLICY "leads_broker_select"
  ON leads FOR SELECT
  TO authenticated
  USING (
    broker_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data ->> 'role' = 'admin'
    )
  );

CREATE POLICY "leads_broker_update"
  ON leads FOR UPDATE
  TO authenticated
  USING (
    broker_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data ->> 'role' = 'admin'
    )
  );

-- Allow anon inserts (landing form submissions)
CREATE POLICY "leads_anon_insert"
  ON leads FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated inserts (manual lead creation)
CREATE POLICY "leads_auth_insert"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ── evaluations: same as leads (through lead_id → broker_id) ──
CREATE POLICY "evaluations_broker_select"
  ON evaluations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = evaluations.lead_id
      AND (
        leads.broker_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM auth.users
          WHERE auth.users.id = auth.uid()
          AND auth.users.raw_user_meta_data ->> 'role' = 'admin'
        )
      )
    )
  );

-- Allow anon inserts (from landing page evaluations)
CREATE POLICY "evaluations_anon_insert"
  ON evaluations FOR INSERT
  TO anon
  WITH CHECK (true);

-- ── config: public read, admin write ──
CREATE POLICY "config_public_read"
  ON config FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "config_admin_write"
  ON config FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data ->> 'role' = 'admin'
    )
  );
