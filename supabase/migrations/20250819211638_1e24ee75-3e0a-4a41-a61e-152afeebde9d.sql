-- First, backup any problematic details data by converting to text
UPDATE dev_breadcrumbs 
SET details = NULL 
WHERE details IS NOT NULL 
  AND details::text != ''
  AND NOT (details::text ~ '^[\s]*[{\[].*[}\]][\s]*$');

-- Now safely convert details to jsonb for valid JSON data
ALTER TABLE dev_breadcrumbs
  ALTER COLUMN details TYPE jsonb USING
    CASE 
      WHEN details IS NULL OR details::text = '' THEN NULL
      ELSE details::jsonb
    END;

-- Set default for tags
ALTER TABLE dev_breadcrumbs
  ALTER COLUMN tags SET DEFAULT '{}'::text[];

-- Ensure RLS is enabled
ALTER TABLE dev_breadcrumbs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and recreate them for owner-only access
DROP POLICY IF EXISTS "dev_breadcrumbs_select_own" ON dev_breadcrumbs;
DROP POLICY IF EXISTS "dev_breadcrumbs_insert_own" ON dev_breadcrumbs;
DROP POLICY IF EXISTS "dev_breadcrumbs_update_own" ON dev_breadcrumbs;

-- Users can only access their own breadcrumbs based on email
CREATE POLICY "dev_breadcrumbs_select_own"
  ON dev_breadcrumbs FOR SELECT
  USING (author_email = auth.email());

CREATE POLICY "dev_breadcrumbs_insert_own"
  ON dev_breadcrumbs FOR INSERT
  WITH CHECK (author_email = auth.email());

CREATE POLICY "dev_breadcrumbs_update_own"
  ON dev_breadcrumbs FOR UPDATE
  USING (author_email = auth.email())
  WITH CHECK (author_email = auth.email());