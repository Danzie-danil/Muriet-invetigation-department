-- Run this script to clean up the manually inserted user that caused the schema error.
DELETE FROM auth.users WHERE email = 'danielidrissa12files@gmail.com';
DELETE FROM public.profiles WHERE full_name = 'Daniel Idrissa';
