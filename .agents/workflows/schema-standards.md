---
description: Procedures for managing database schema, SQL migrations, and RLS policies.
---

# Database Schema & RLS Standards

Refer to [design-tokens.md](file:///d:/Muriet%20invetigation%20department/.agents/workflows/design-tokens.md) for all hex codes and constants.

## 1. SQL File Naming (Mandatory)
- **New Feature/Entity**: `create_[feature_name].sql` (e.g., `create_evidence.sql`).
- **Update/Change**: `add_[column/constraint]_to_[table].sql` (e.g., `add_description_to_cases.sql`).
- **Triggers/Functions**: `setup_function_name.sql`.

## 2. Migration Execution Pattern
1. Create focused SQL in `supabase/` folder.
2. Synchronize to [schema.sql](file:///d:/Muriet%20invetigation%20department/supabase/schema.sql).
3. **Template for RLS Policies**:

```sql
ALTER TABLE your_table_name ENABLE ROW LEVEL SECURITY;

-- 🛡️ SELECT: Allow authenticated users
CREATE POLICY "authenticated_select_all" 
ON your_table_name FOR SELECT 
TO authenticated 
USING (true);

-- 🛡️ INSERT: Allow authenticated users
CREATE POLICY "authenticated_insert_all" 
ON your_table_name FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 🛡️ UPDATE: Allow authenticated users
CREATE POLICY "authenticated_update_all" 
ON your_table_name FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);
```

## 3. Real-time Publications
If a table needs to trigger "Silent Refresh" on the frontend, add it to the `supabase_realtime` publication:

```sql
alter publication supabase_realtime add table your_table_name;
```

## 4. Submission Checklist
- [ ] Is the SQL file naming following the `create_` or `add_` pattern?
- [ ] Is RLS enabled and a policy created for every operation?
- [ ] **RLS Granularity Review**:
    - [ ] Have you applied the **Principle of Least Privilege**? (e.g., avoid `USING (true)` for all authenticated users if the data should be restricted to owners or specific roles).
    - [ ] Are policies for sensitive tables (e.g. `cases`, `system_logs`) restricted by `auth.uid()` or role checks?
    - [ ] Do administrative tables confirm the creator's role via a lookup to the `profiles` table?
- [ ] Has the definition been appended to the main `supabase/schema.sql`?

