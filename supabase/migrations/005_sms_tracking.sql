-- SMS tracking on payments
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS sms_status TEXT,        -- 'sent' | 'failed' | 'pending'
  ADD COLUMN IF NOT EXISTS sms_message_id TEXT,
  ADD COLUMN IF NOT EXISTS sms_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sms_error TEXT;

-- SMS delivery logs (full history including resends)
CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL,          -- 'sent' | 'failed'
  message_id TEXT,               -- Orange resourceURL / delivery token
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_logs_payment_id ON sms_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_created_at ON sms_logs(created_at DESC);
