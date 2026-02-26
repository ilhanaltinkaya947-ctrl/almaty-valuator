-- ══════════════════════════════════════
-- 007: Authorized Telegram Agents
-- ══════════════════════════════════════

CREATE TYPE agent_role AS ENUM ('admin', 'broker');

CREATE TABLE authorized_agents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id bigint UNIQUE NOT NULL,
  name        text NOT NULL,
  role        agent_role NOT NULL DEFAULT 'broker',
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_agents_updated_at
  BEFORE UPDATE ON authorized_agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_agents_telegram_id ON authorized_agents (telegram_id);

-- RLS
ALTER TABLE authorized_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage agents"
  ON authorized_agents FOR ALL
  USING (
    auth.uid() IS NOT NULL
    AND (SELECT raw_user_meta_data ->> 'role' FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

-- Seed: Add admin (replace telegram_id with actual value)
-- INSERT INTO authorized_agents (telegram_id, name, role)
-- VALUES (123456789, 'Admin', 'admin');
