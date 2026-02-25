-- ══════════════════════════════════════════════════
-- 004: System Config (key-value store)
-- ══════════════════════════════════════════════════

CREATE TABLE config (
  key         text PRIMARY KEY,
  value       jsonb NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER config_updated_at
  BEFORE UPDATE ON config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed initial config
INSERT INTO config (key, value) VALUES
  ('base_rate', '738300'),
  ('market_growth_pct', '9');
