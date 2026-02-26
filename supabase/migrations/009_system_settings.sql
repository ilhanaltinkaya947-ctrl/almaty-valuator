-- 009: System Settings table for dynamic configuration
-- Replaces hardcoded constants (base_rate, buyback_discount, margin_target)
-- Admins can update via CRM or Telegram without code changes

CREATE TABLE IF NOT EXISTS system_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key text UNIQUE NOT NULL,
  value_numeric decimal NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now()
);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_system_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER system_settings_updated
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_system_settings_timestamp();

-- Seed default values
INSERT INTO system_settings (key, value_numeric, description) VALUES
  ('base_rate', 805000, 'Base price per sqm in tenge'),
  ('buyback_discount', 0.70, 'Buyback coefficient (offer = market * this)'),
  ('margin_target', 0.15, 'Target margin percentage')
ON CONFLICT (key) DO NOTHING;

-- RLS: public read, service-role write
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read system_settings"
  ON system_settings FOR SELECT
  USING (true);

CREATE POLICY "Service role write system_settings"
  ON system_settings FOR ALL
  USING (auth.role() = 'service_role');
