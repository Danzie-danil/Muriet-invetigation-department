import { useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { db } from '../../db/db';

/**
 * BackgroundDataSync Component
 * Silently synchronizes high-priority data and binary assets to IndexedDB
 * after the initial application load.
 */
const BackgroundDataSync = () => {
  useEffect(() => {
    // Check if we are authenticated before starting sync
    const checkAuthAndSync = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Wait 3 seconds after the app starts to begin heavy background sync
        const syncTimer = setTimeout(() => {
          syncMugshots();
        }, 3000);
        return () => clearTimeout(syncTimer);
      }
    };
    
    checkAuthAndSync();
  }, []);

  const syncMugshots = async () => {
    console.log('[SYNC] Starting background mugshot synchronization...');
    try {
      // 1. Fetch metadata for all mugshots
      const { data: records, error } = await supabase
        .from('case_mugshots')
        .select('case_id, file_path')
        .order('created_at', { ascending: false })
        .limit(100); // Limit to 100 most recent for sync

      if (error || !records) return;

      // 2. Process each record one by one with a small delay
      for (const record of records) {
        try {
          // Check if already in cache
          const existing = await db.mugshots.get(record.case_id);
          if (existing?.blob) continue;

          // Not in cache, download the blob
          console.log(`[SYNC] Pre-fetching mugshot for case: ${record.case_id}`);
          const { data: blob, error: dlErr } = await supabase.storage
            .from('mugshots')
            .download(record.file_path);

          if (!dlErr && blob) {
            await db.mugshots.put({
              id: record.case_id,
              case_id: record.case_id,
              file_path: record.file_path,
              blob: blob,
              created_at: new Date()
            });
          }

          // Rate limit: wait 500ms between downloads to preserve bandwidth for user actions
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (e) {
          console.warn(`[SYNC] Failed to pre-fetch mugshot for ${record.case_id}:`, e);
        }
      }
      console.log('[SYNC] Background synchronization completed.');
    } catch (err) {
      console.error('[SYNC] Critical sync error:', err);
    }
  };

  return null; // This is a background service component
};

export default BackgroundDataSync;
