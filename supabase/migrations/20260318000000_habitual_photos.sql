-- Migration: Add support for habitual criminal photos to case_mugshots
-- Date: 2026-03-18

-- 1. Alter case_mugshots table
ALTER TABLE case_mugshots 
  ALTER COLUMN case_id DROP NOT NULL;

ALTER TABLE case_mugshots
  ADD COLUMN IF NOT EXISTS habitual_id UUID REFERENCES habitual_register(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_habitual BOOLEAN DEFAULT FALSE;

-- 2. Add check constraint to ensure data integrity
-- Either case_id OR habitual_id must be present, and is_habitual must match.
ALTER TABLE case_mugshots
  DROP CONSTRAINT IF EXISTS check_photo_source,
  ADD CONSTRAINT check_photo_source 
  CHECK (
    (case_id IS NOT NULL AND habitual_id IS NULL AND is_habitual = FALSE) OR
    (habitual_id IS NOT NULL AND case_id IS NULL AND is_habitual = TRUE)
  );

-- 3. Update RLS (if needed, though existing policy is already authenticated-based)
-- The existing policy for case_mugshots is:
-- CREATE POLICY "View mugshots" ON case_mugshots FOR SELECT TO authenticated USING (true);
-- CREATE POLICY "Insert mugshots" ON case_mugshots FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()));
-- These are sufficient for now.
