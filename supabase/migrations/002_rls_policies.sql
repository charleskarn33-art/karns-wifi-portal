-- Enable Row Level Security
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Helper function: check if current user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PACKAGES policies
-- Public can read active packages
CREATE POLICY "packages_public_read" ON packages
  FOR SELECT USING (is_active = true);

-- Admins can do everything
CREATE POLICY "packages_admin_all" ON packages
  FOR ALL USING (is_admin());

-- VOUCHERS policies
-- Only admins can manage vouchers
CREATE POLICY "vouchers_admin_all" ON vouchers
  FOR ALL USING (is_admin());

-- PAYMENTS policies
-- Anyone can insert a payment (customer submission)
CREATE POLICY "payments_public_insert" ON payments
  FOR INSERT WITH CHECK (true);

-- Admins can do everything with payments
CREATE POLICY "payments_admin_all" ON payments
  FOR ALL USING (is_admin());

-- ADMINS policies
-- Admins can read admin list
CREATE POLICY "admins_admin_read" ON admins
  FOR SELECT USING (is_admin());

-- Only service role can insert admins (via migration or admin panel)
CREATE POLICY "admins_service_insert" ON admins
  FOR INSERT WITH CHECK (is_admin());
