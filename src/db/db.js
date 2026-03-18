import Dexie from 'dexie';

/**
 * Muriet Investigation Portal - Local Database System
 * Powered by Dexie.js (IndexedDB wrapper)
 */
export const db = new Dexie('MurietInvestigationPortal');

// Define the database schema
// Note: We only index fields we frequently query or sort by.
// The ++id is the primary key (auto-incrementing if needed, but we typically use UUIDs from Supabase).
db.version(1).stores({
  cases: 'id, rb_number, suspect_full_name, status, created_at, year',
  accomplices: 'id, case_id',
  mugshots: 'id, case_id, file_path',
  habitual_register: 'id, suspect_name, suspect_national_id, reporting_day',
  habitual_attendance: 'id, register_id, io_officer, attendance_date',
  system: 'key' // For settings, language, user profile
});

/**
 * Utility to sync an array of items to a Dexie table (Bulk Upsert)
 */
export const syncTable = async (tableName, items) => {
  if (!items || !items.length) return;
  try {
    await db[tableName].bulkPut(items);
  } catch (err) {
    console.error(`[DB] Error syncing table ${tableName}:`, err);
  }
};

/**
 * Utility to clear a table
 */
export const clearTable = async (tableName) => {
  try {
    await db[tableName].clear();
  } catch (err) {
    console.error(`[DB] Error clearing table ${tableName}:`, err);
  }
};
