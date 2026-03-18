-- Enable Supabase Realtime replication on all application tables.
-- Run this in the Supabase SQL Editor to allow real-time subscriptions.

ALTER PUBLICATION supabase_realtime ADD TABLE cases;
ALTER PUBLICATION supabase_realtime ADD TABLE habitual_register;
ALTER PUBLICATION supabase_realtime ADD TABLE habitual_attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE court_assessment;
ALTER PUBLICATION supabase_realtime ADD TABLE case_progression;
ALTER PUBLICATION supabase_realtime ADD TABLE system_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE findings;
ALTER PUBLICATION supabase_realtime ADD TABLE evidence_storage;
ALTER PUBLICATION supabase_realtime ADD TABLE finding_updates;
ALTER PUBLICATION supabase_realtime ADD TABLE case_drafts;
