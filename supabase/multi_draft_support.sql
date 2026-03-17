-- Modify case_drafts to allow multiple drafts per user
ALTER TABLE case_drafts DROP CONSTRAINT IF EXISTS case_drafts_pkey;
ALTER TABLE case_drafts ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT uuid_generate_v4();

-- Add index for faster user draft lookup
CREATE INDEX IF NOT EXISTS idx_case_drafts_user_id ON case_drafts(user_id);

-- Update the cleanup function to handle the new structure if necessary 
-- (The existing expire_drafts.sql logic already uses user_id and updated_at, so it should still work)
