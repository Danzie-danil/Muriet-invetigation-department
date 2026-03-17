-- Run this script in the Supabase SQL Editor
-- This will automatically find the user you created in the Dashboard and link their profile correctly.

INSERT INTO public.profiles (id, full_name, role, badge_number)
SELECT id, 'Daniel Idrissa', 'ocs', 'OCS-001'
FROM auth.users
WHERE email = 'danielidrissa12files@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  badge_number = EXCLUDED.badge_number;
