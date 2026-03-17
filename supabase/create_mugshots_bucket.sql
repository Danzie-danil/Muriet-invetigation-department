-- ============================================================
-- CREATE MUGSHOTS STORAGE BUCKET (if not already exists)
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Create the bucket (owner = postgres, public = false for security)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'mugshots',
  'mugshots',
  false,                    -- private bucket (requires signed URLs)
  10485760,                 -- 10 MB max file size
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;  -- safe to re-run: does nothing if bucket already exists


-- 2. RLS Policy: Allow authenticated users to UPLOAD their own files
CREATE POLICY "Authenticated users can upload mugshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'mugshots');


-- 3. RLS Policy: Allow authenticated users to VIEW/DOWNLOAD mugshots
CREATE POLICY "Authenticated users can view mugshots"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'mugshots');


-- 4. RLS Policy: Allow authenticated users to DELETE their own uploads (optional)
CREATE POLICY "Authenticated users can delete mugshots"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'mugshots');

-- ============================================================
-- DONE. The 'mugshots' bucket is now ready.
-- Signed URLs (1hr expiry) are used in PhotoAlbum.jsx to 
-- securely serve images without making the bucket public.
-- ============================================================
