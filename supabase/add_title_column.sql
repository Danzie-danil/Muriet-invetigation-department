-- Add 'title' column to cases table
ALTER TABLE cases
ADD COLUMN IF NOT EXISTS title TEXT;
