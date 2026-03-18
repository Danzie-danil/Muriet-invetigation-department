-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. ENUMS AND CUSTOM TYPES
-- ==========================================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ocs', 'oc_cid', 'io');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==========================================
-- 2. CORE TABLES
-- ==========================================

-- Profiles Table (To manage officers)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  role user_role NOT NULL,
  badge_number TEXT UNIQUE,
  preferred_language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cases Table
CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rb_number TEXT UNIQUE NOT NULL, -- Format: MURIET/RB/0001/2026
  title TEXT,
  year INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
  io_id UUID REFERENCES profiles(id),
  
  -- Pre-evaluation Data
  incident_info TEXT, -- How it was received (Phone/Report)
  incident_location TEXT,
  initial_findings TEXT,
  prior_actions_taken TEXT,
  date_of_crime DATE,
  date_of_reporting DATE DEFAULT CURRENT_DATE,
  
  -- Criminal Details (Mandatory)
  suspect_full_name TEXT NOT NULL,
  suspect_dob DATE NOT NULL,
  suspect_pob TEXT, -- Place of Birth
  suspect_residence TEXT,
  suspect_phone TEXT,
  suspect_occupation TEXT,
  suspect_national_id TEXT NOT NULL,
  
  -- State & Timestamps
  status TEXT DEFAULT 'Under Investigation',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  locked BOOLEAN DEFAULT FALSE
);

COMMENT ON COLUMN cases.date_of_crime IS 'The actual date when the crime/incident occurred';
COMMENT ON COLUMN cases.date_of_reporting IS 'The date when the case was officially reported to the station';

-- Accomplices Table (Link to Case)
CREATE TABLE IF NOT EXISTS accomplices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  national_id TEXT NOT NULL,
  dob DATE,
  residence TEXT,
  phone TEXT
);

-- Evidence & Mugshots (Storage References)
CREATE TABLE IF NOT EXISTS evidence_storage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  finding_id UUID, -- Optional: Link to a specific pre-evaluation finding
  file_type TEXT, -- 'mugshot', 'fingerprint', 'document', 'pf3', 'charge_sheet', 'pre-evaluation'
  file_path TEXT NOT NULL, -- Supabase Storage Path
  file_name TEXT,
  file_size BIGINT,
  original_filename TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Moved below habitual_register to support foreign key reference

-- Case Progression
CREATE TABLE IF NOT EXISTS case_progression (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  action_by_sa TEXT,
  decisions_made TEXT,
  reasoning TEXT,
  date_forwarded_to_sa TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  snapshot_data JSONB
);

-- Habitual Criminals
CREATE TABLE IF NOT EXISTS habitual_register (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  suspect_national_id TEXT UNIQUE NOT NULL,
  suspect_name TEXT NOT NULL,
  reporting_day TEXT,
  last_evaluated TIMESTAMPTZ,
  status TEXT DEFAULT 'Active'
);

-- Case Mugshots (Photo Album) - Moved here to reference habitual_register
CREATE TABLE IF NOT EXISTS case_mugshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  habitual_id UUID REFERENCES habitual_register(id) ON DELETE CASCADE,
  is_habitual BOOLEAN DEFAULT FALSE,
  file_path TEXT NOT NULL,
  original_filename TEXT,
  file_size BIGINT,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_photo_source CHECK (
    (case_id IS NOT NULL AND habitual_id IS NULL AND is_habitual = FALSE) OR
    (habitual_id IS NOT NULL AND case_id IS NULL AND is_habitual = TRUE)
  )
);

CREATE TABLE IF NOT EXISTS habitual_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  register_id UUID REFERENCES habitual_register(id) ON DELETE CASCADE,
  attendance_date TIMESTAMPTZ DEFAULT NOW(),
  remarks TEXT,
  io_officer UUID REFERENCES profiles(id)
);

-- Court Assessment
CREATE TABLE IF NOT EXISTS court_assessment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  court_name TEXT NOT NULL,
  case_number_court TEXT UNIQUE,
  presiding_magistrate TEXT,
  prosecutor_id UUID REFERENCES profiles(id),
  date_commenced DATE,
  current_stage TEXT,
  next_hearing_date DATE,
  verdict TEXT,
  sentence_details TEXT,
  judgment_document_path TEXT,
  is_closed BOOLEAN DEFAULT FALSE,
  is_high_profile BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Audit Logs
CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Findings Table
CREATE TABLE IF NOT EXISTS findings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  location TEXT,
  finding_date DATE DEFAULT CURRENT_DATE,
  io_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Finding Updates
CREATE TABLE IF NOT EXISTS finding_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  finding_id UUID REFERENCES findings(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  io_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Case Drafts (Multi-draft support)
CREATE TABLE IF NOT EXISTS case_drafts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_drafts_user_id ON case_drafts(user_id);

-- ==========================================
-- 3. TRIGGERS AND FUNCTIONS
-- ==========================================

-- A. RB Number Generator (MURIET/RB/XXXX/YYYY)
CREATE OR REPLACE FUNCTION generate_muriet_rb_number()
RETURNS TRIGGER AS $$
DECLARE
    current_year_text TEXT;
    next_sequence_number INTEGER;
    formatted_sequence TEXT;
BEGIN
    current_year_text := EXTRACT(YEAR FROM NOW())::TEXT;
    
    -- Safety: If RB number is missing OR already exists (prevents manual insert collisions)
    IF NEW.rb_number IS NULL OR NEW.rb_number = '' OR EXISTS (SELECT 1 FROM cases WHERE rb_number = NEW.rb_number) THEN
        SELECT COALESCE(MAX(CAST(substring(rb_number FROM '/RB/([0-9]+)/') AS INTEGER)), 0) + 1
        INTO next_sequence_number
        FROM cases
        WHERE rb_number LIKE '%/' || current_year_text;

        formatted_sequence := LPAD(next_sequence_number::TEXT, 4, '0');
        NEW.rb_number := 'MURIET/RB/' || formatted_sequence || '/' || current_year_text;
    END IF;

    IF NEW.year IS NULL THEN
        NEW.year := EXTRACT(YEAR FROM NOW())::INTEGER;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE TRIGGER tr_generate_rb_before_insert
BEFORE INSERT ON cases
FOR EACH ROW
EXECUTE FUNCTION generate_muriet_rb_number();

-- RPC Function for frontend pre-fill
CREATE OR REPLACE FUNCTION get_next_rb_number()
RETURNS TEXT AS $$
DECLARE
    current_year_text TEXT;
    next_sequence_number INTEGER;
    formatted_sequence TEXT;
BEGIN
    current_year_text := EXTRACT(YEAR FROM NOW())::TEXT;
    SELECT COALESCE(MAX(CAST(substring(rb_number FROM '/RB/([0-9]+)/') AS INTEGER)), 0) + 1
    INTO next_sequence_number
    FROM cases
    WHERE rb_number LIKE '%/' || current_year_text;

    formatted_sequence := LPAD(next_sequence_number::TEXT, 4, '0');
    RETURN 'MURIET/RB/' || formatted_sequence || '/' || current_year_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- B. Lock Case on Court Conclusion
CREATE OR REPLACE FUNCTION lock_case_on_verdict()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.verdict IS NOT NULL AND NEW.verdict != '' THEN
        UPDATE cases 
        SET status = 'Concluded', locked = TRUE, updated_at = NOW()
        WHERE id = NEW.case_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE TRIGGER tr_lock_case_on_verdict
AFTER INSERT OR UPDATE ON court_assessment
FOR EACH ROW
EXECUTE FUNCTION lock_case_on_verdict();

-- C. Audit Log Triggers
-- Log Case Status Changes
CREATE OR REPLACE FUNCTION log_case_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO system_logs (user_id, action, table_name, record_id, details)
        VALUES (
            auth.uid(), 
            'STATUS_CHANGE', 
            'cases', 
            NEW.id, 
            jsonb_build_object(
                'rb_number', NEW.rb_number, 
                'title', NEW.title, 
                'old_status', OLD.status, 
                'new_status', NEW.status
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER tr_log_case_status
AFTER UPDATE ON cases
FOR EACH ROW
EXECUTE FUNCTION log_case_status_change();

-- Log Case Creation
CREATE OR REPLACE FUNCTION log_case_creation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO system_logs (user_id, action, table_name, record_id, details)
    VALUES (auth.uid(), 'CREATE_CASE', 'cases', NEW.id, jsonb_build_object('rb_number', NEW.rb_number, 'suspect', NEW.suspect_full_name));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER tr_log_case_creation
AFTER INSERT ON cases
FOR EACH ROW EXECUTE FUNCTION log_case_creation();

-- Log Case Deletion
CREATE OR REPLACE FUNCTION log_case_deletion()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO system_logs (user_id, action, table_name, record_id, details)
    VALUES (auth.uid(), 'DELETE_CASE', 'cases', OLD.id, jsonb_build_object('rb_number', OLD.rb_number));
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER tr_log_case_deletion
BEFORE DELETE ON cases
FOR EACH ROW EXECUTE FUNCTION log_case_deletion();

-- Log Evidence Uploads
CREATE OR REPLACE FUNCTION log_evidence_upload()
RETURNS TRIGGER AS $$
DECLARE
    case_rb TEXT;
    case_title TEXT;
BEGIN
    -- Fetch case info so the log remains readable even if we log at the exhibit level
    SELECT rb_number, title INTO case_rb, case_title FROM cases WHERE id = NEW.case_id;
    
    INSERT INTO system_logs (user_id, action, table_name, record_id, details)
    VALUES (
        auth.uid(), 
        'UPLOAD_EVIDENCE', 
        'evidence_storage', 
        NEW.id, 
        jsonb_build_object(
            'rb_number', case_rb, 
            'title', case_title, 
            'file_name', NEW.original_filename
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER tr_log_evidence_upload
AFTER INSERT ON evidence_storage
FOR EACH ROW EXECUTE FUNCTION log_evidence_upload();

-- D. Draft Expiry Cleanup
CREATE OR REPLACE FUNCTION trigger_cleanup_drafts()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM case_drafts
    WHERE user_id = NEW.user_id 
      AND updated_at < NOW() - INTERVAL '7 days';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE TRIGGER tr_cleanup_old_drafts
BEFORE INSERT OR UPDATE ON case_drafts
FOR EACH ROW
EXECUTE FUNCTION trigger_cleanup_drafts();

-- Manual cleanup RPC
CREATE OR REPLACE FUNCTION delete_expired_drafts()
RETURNS void AS $$
BEGIN
    DELETE FROM case_drafts
    WHERE updated_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- E. Auto-create Profile on Signup
CREATE OR REPLACE FUNCTION handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, preferred_language)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Officer ' || SUBSTRING(NEW.id::text, 1, 8)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'io'::user_role),
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER tr_on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user_profile();

-- F. Officer Statistics (Security Hardened)
CREATE OR REPLACE FUNCTION public.get_officer_stats()
RETURNS TABLE(officer_id uuid, officer_name text, total_cases bigint, concluded_cases bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        p.id as officer_id,
        p.full_name as officer_name,
        COUNT(c.id) as total_cases,
        COUNT(c.id) FILTER (WHERE c.status = 'Concluded') as concluded_cases
    FROM public.profiles p
    LEFT JOIN public.cases c ON p.id = c.io_id
    GROUP BY p.id, p.full_name;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_officer_stats(officer_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
    active_cases INT;
    court_cases INT;
    result JSONB;
BEGIN
    SELECT COUNT(*) INTO active_cases FROM public.cases WHERE io_id = officer_id AND status != 'Concluded';
    SELECT COUNT(*) INTO court_cases
    FROM public.cases c
    JOIN public.court_assessment ca ON c.id = ca.case_id
    WHERE c.io_id = officer_id AND ca.is_closed = FALSE;

    result := jsonb_build_object(
        'active_investigations', active_cases,
        'cases_in_court', court_cases
    );
    RETURN result;
END;
$function$;


-- ==========================================
-- 4. DATABASE VIEWS
-- ==========================================

CREATE OR REPLACE VIEW case_timeline_view 
WITH (security_invoker = true) -- Fix: Ensure view respects RLS
AS
SELECT 
    c.id AS case_id,
    c.rb_number,
    c.status AS current_status,
    c.created_at AS date_opened,
    c.suspect_full_name,
    c.incident_info AS initial_report,
    (SELECT COUNT(*) FROM evidence_storage WHERE case_id = c.id) AS total_exhibits,
    cp.date_forwarded_to_sa,
    cp.action_by_sa,
    cp.decisions_made AS sa_decision,
    ca.court_name,
    ca.next_hearing_date,
    ca.presiding_magistrate,
    ca.verdict AS final_verdict
FROM cases c
LEFT JOIN case_progression cp ON c.id = cp.case_id
LEFT JOIN court_assessment ca ON c.id = ca.case_id;

-- ==========================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE accomplices ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_storage ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_progression ENABLE ROW LEVEL SECURITY;
ALTER TABLE habitual_register ENABLE ROW LEVEL SECURITY;
ALTER TABLE habitual_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_assessment ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE finding_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_mugshots ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS "View all profiles" ON profiles;
CREATE POLICY "View all profiles" ON profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Insert individual profiles" ON profiles;
CREATE POLICY "Insert individual profiles" ON profiles FOR INSERT TO authenticated WITH CHECK (
    -- Only allow OCS/OC_CID to register others OR allow a user to register their own profile 
    -- as long as they don't give themselves an admin role unless they already are an admin.
    (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ocs', 'oc_cid')))
    OR (auth.uid() = id AND role = 'io') -- Default new self-signups to 'io'
);

DROP POLICY IF EXISTS "Update profiles" ON profiles;
CREATE POLICY "Update profiles" ON profiles FOR UPDATE TO authenticated 
USING (auth.uid() = id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ocs', 'oc_cid')));

-- Cases
DROP POLICY IF EXISTS "View assigned or admin cases" ON cases;
CREATE POLICY "View assigned or admin cases" ON cases FOR SELECT TO authenticated 
USING (
    (io_id = auth.uid()) 
    OR (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ocs', 'oc_cid')))
);

DROP POLICY IF EXISTS "Insert cases" ON cases;
CREATE POLICY "Insert cases" ON cases FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Update assigned cases" ON cases;
CREATE POLICY "Update assigned cases" ON cases FOR UPDATE TO authenticated 
USING ((io_id = auth.uid() AND locked = FALSE) OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ocs', 'oc_cid')));

-- Case Drafts
DROP POLICY IF EXISTS "Manage own drafts" ON case_drafts;
CREATE POLICY "Manage own drafts" ON case_drafts FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Other tables (simplified for master schema)
DROP POLICY IF EXISTS "Standard view policy" ON accomplices;
CREATE POLICY "Standard view policy" ON accomplices FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Insert accomplices" ON accomplices; -- Clean up legacy permissive policy
DROP POLICY IF EXISTS "Standard insert policy" ON accomplices;
CREATE POLICY "Standard insert policy" ON accomplices FOR INSERT TO authenticated 
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Standard view policy" ON evidence_storage;
CREATE POLICY "Standard view policy" ON evidence_storage FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Standard insert policy" ON evidence_storage;
CREATE POLICY "Standard insert policy" ON evidence_storage FOR INSERT TO authenticated 
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()));

-- Case Mugshots
DROP POLICY IF EXISTS "View mugshots" ON case_mugshots;
CREATE POLICY "View mugshots" ON case_mugshots FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Insert mugshots" ON case_mugshots;
CREATE POLICY "Insert mugshots" ON case_mugshots FOR INSERT TO authenticated 
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Delete mugshots" ON case_mugshots;
CREATE POLICY "Delete mugshots" ON case_mugshots FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ocs', 'oc_cid')));

DROP POLICY IF EXISTS "Standard view policy" ON case_progression;
CREATE POLICY "Standard view policy" ON case_progression FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Standard management policy" ON case_progression;
CREATE POLICY "Standard management policy" ON case_progression FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ocs', 'oc_cid')));

DROP POLICY IF EXISTS "Standard view policy" ON habitual_register;
CREATE POLICY "Standard view policy" ON habitual_register FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Standard view policy" ON habitual_attendance;
CREATE POLICY "Standard view policy" ON habitual_attendance FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Standard view policy" ON court_assessment;
CREATE POLICY "Standard view policy" ON court_assessment FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Standard view policy" ON findings;
CREATE POLICY "Standard view policy" ON findings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Standard view policy" ON finding_updates;
CREATE POLICY "Standard view policy" ON finding_updates FOR SELECT TO authenticated USING (true);

-- System Logs (Security Hardened)
DROP POLICY IF EXISTS "Restrictive log view" ON system_logs;
CREATE POLICY "Restrictive log view" ON system_logs FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ocs', 'oc_cid')));



-- ==========================================
-- 6. STORAGE BUCKETS
-- ==========================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES 
('evidence', 'evidence', false, 52428800, NULL),
('court_docs', 'court_docs', false, 10485760, NULL),
('mugshots', 'mugshots', false, 10485760, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Authenticated upload" ON storage.objects;
CREATE POLICY "Authenticated upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('evidence', 'court_docs', 'mugshots'));

DROP POLICY IF EXISTS "Authenticated read" ON storage.objects;
CREATE POLICY "Authenticated read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id IN ('evidence', 'court_docs', 'mugshots'));

DROP POLICY IF EXISTS "Authenticated delete" ON storage.objects;
CREATE POLICY "Authenticated delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id IN ('evidence', 'court_docs', 'mugshots'));

