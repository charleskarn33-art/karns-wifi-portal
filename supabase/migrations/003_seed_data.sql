-- Seed packages
INSERT INTO packages (name, duration_hours, price, description, is_active) VALUES
  ('24 Hours', 24, 5.00, 'Get unlimited WiFi access for 24 hours. Perfect for short-term use.', true),
  ('30 Days', 720, 50.00, 'Get unlimited WiFi access for 30 days. Best value for regular users.', true);

-- Note: Admin accounts are created via Supabase Auth + admins table insert.
-- Run the following after creating the admin user in Supabase Auth:
--
-- INSERT INTO admins (user_id, email, full_name)
-- VALUES ('<auth-user-uuid>', 'admin@example.com', 'Admin Name');
