-- Add preferred_language column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';

-- Update existing profiles to ensure they have the default 'en'
UPDATE profiles 
SET preferred_language = 'en' 
WHERE preferred_language IS NULL;
