-- ============================================================
-- CREATE CASE DRAFTS TABLE
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.case_drafts (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.case_drafts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own drafts
CREATE POLICY "Users can manage their own drafts"
ON public.case_drafts
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- DONE. The 'case_drafts' table is now ready for cloud autosave.
-- ============================================================
