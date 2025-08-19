-- Self-Test RLS Policies Migration
-- Ensure proper RLS policies for posts and events tables

-- Posts table RLS policies (replace existing ones)
DROP POLICY IF EXISTS "Users can view own posts" ON posts;
DROP POLICY IF EXISTS "Users can insert own posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;

-- Ensure RLS is enabled
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- SELECT: owners can read their posts
CREATE POLICY "posts_select_own"
  ON posts FOR SELECT
  USING (account_id = auth.uid());

-- INSERT: owners can insert only if they set their own account_id
CREATE POLICY "posts_insert_own"
  ON posts FOR INSERT
  WITH CHECK (account_id = auth.uid());

-- UPDATE: owners can update their posts
CREATE POLICY "posts_update_own"
  ON posts FOR UPDATE
  USING (account_id = auth.uid())
  WITH CHECK (account_id = auth.uid());

-- DELETE: owners can delete their posts
CREATE POLICY "posts_delete_own"
  ON posts FOR DELETE
  USING (account_id = auth.uid());

-- Events table RLS policies
DROP POLICY IF EXISTS "Users can view own events" ON events;

-- Ensure RLS is enabled
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- SELECT: users can view events for their posts
CREATE POLICY "events_select_own"
  ON events FOR SELECT
  USING (
    ig_post_id IN (
      SELECT p.ig_post_id
      FROM posts p
      WHERE p.account_id = auth.uid()
    )
  );

-- INSERT: for service role to insert events (edge functions)
-- This allows service role to insert without restrictions
CREATE POLICY "events_insert_service"
  ON events FOR INSERT
  TO service_role
  WITH CHECK (true);

-- INSERT: authenticated users can insert events for their own posts
CREATE POLICY "events_insert_own"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    ig_post_id IN (
      SELECT p.ig_post_id
      FROM posts p
      WHERE p.account_id = auth.uid()
    )
  );