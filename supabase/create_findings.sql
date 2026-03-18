-- Support for Pre-evaluation Findings and multiple attachments
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

-- Allow multiple attachments for findings
ALTER TABLE evidence_storage ADD COLUMN IF NOT EXISTS finding_id UUID REFERENCES findings(id) ON DELETE CASCADE;
ALTER TABLE evidence_storage ADD COLUMN IF NOT EXISTS original_filename TEXT;

-- RLS for findings
ALTER TABLE findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View all findings" ON findings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert findings" ON findings FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Update findings" ON findings FOR UPDATE TO authenticated 
USING (
  io_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ocs', 'oc_cid'))
);


CREATE TABLE IF NOT EXISTS finding_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  finding_id UUID REFERENCES findings(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  io_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for finding_updates
ALTER TABLE finding_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View all finding updates" ON finding_updates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert finding updates" ON finding_updates FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

