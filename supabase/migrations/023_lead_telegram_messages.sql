-- Track sent Telegram notification message IDs for broadcast editing (e.g., when lead is claimed)
CREATE TABLE IF NOT EXISTS lead_telegram_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  chat_id TEXT NOT NULL,
  message_id INTEGER NOT NULL,
  notification_type TEXT NOT NULL DEFAULT 'new_lead',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ltm_lead_id ON lead_telegram_messages(lead_id);
CREATE INDEX idx_ltm_lead_type ON lead_telegram_messages(lead_id, notification_type);
