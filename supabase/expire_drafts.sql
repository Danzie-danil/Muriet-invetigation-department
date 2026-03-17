-- Create a function to clean up old drafts
CREATE OR REPLACE FUNCTION delete_expired_drafts()
RETURNS void AS $$
BEGIN
    DELETE FROM case_drafts
    WHERE updated_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Although Supabase doesn't have a native Cron-like trigger for this without pg_cron,
-- we can trigger a cleanup check whenever a draft is updated/inserted, 
-- or provide this function for manual/external scheduled runs.
-- Alternatively, we can use a trigger on INSERT/UPDATE to perform a limited cleanup.

CREATE OR REPLACE FUNCTION trigger_cleanup_drafts()
RETURNS TRIGGER AS $$
BEGIN
    -- Perform cleanup for the current user's expired drafts to keep it efficient
    DELETE FROM case_drafts
    WHERE user_id = NEW.user_id 
      AND updated_at < NOW() - INTERVAL '7 days';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_cleanup_old_drafts
BEFORE INSERT OR UPDATE ON case_drafts
FOR EACH ROW
EXECUTE FUNCTION trigger_cleanup_drafts();

-- Update the cases search/fetch logic (optional, but good practice)
-- In the app, we should also ensure we don't fetch expired drafts if the trigger somehow misses them.
