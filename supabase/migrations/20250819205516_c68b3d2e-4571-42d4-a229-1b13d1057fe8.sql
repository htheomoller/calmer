-- Ensure RLS is enabled on dev_breadcrumbs
ALTER TABLE dev_breadcrumbs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to recreate them
DROP POLICY IF EXISTS "dev_breadcrumbs_select_own" ON dev_breadcrumbs;
DROP POLICY IF EXISTS "dev_breadcrumbs_insert_own" ON dev_breadcrumbs;
DROP POLICY IF EXISTS "dev_breadcrumbs_update_own" ON dev_breadcrumbs;

-- Create new RLS policies for user-owned operations
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