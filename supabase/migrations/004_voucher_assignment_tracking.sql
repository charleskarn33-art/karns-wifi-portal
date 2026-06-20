-- Add tracking columns to vouchers
ALTER TABLE vouchers
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS assigned_to_phone TEXT;

-- Prevent the same voucher being assigned to two payments
ALTER TABLE vouchers
  ADD CONSTRAINT vouchers_payment_id_unique UNIQUE (payment_id);
