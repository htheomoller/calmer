-- Migrate existing dev_breadcrumbs table to use user_id instead of author_email
-- Add user_id column with default
ALTER TABLE public.dev_breadcrumbs 
ADD COLUMN IF NOT EXISTS user_id uuid;

-- Update existing rows to set user_id based on author_email
-- This is a best-effort migration for existing data
UPDATE public.dev_breadcrumbs 
SET user_id = auth.uid() 
WHERE user_id IS NULL AND author_email IS NOT NULL;

-- Set default for user_id and make it not null
ALTER TABLE public.dev_breadcrumbs 
ALTER COLUMN user_id SET DEFAULT auth.uid(),
ALTER COLUMN user_id SET NOT NULL;

-- Add the 'at' column if it doesn't exist (it should, but making sure)
ALTER TABLE public.dev_breadcrumbs 
ADD COLUMN IF NOT EXISTS at timestamptz DEFAULT now();

-- Drop old policies
DROP POLICY IF EXISTS "Users can view their own breadcrumbs" ON public.dev_breadcrumbs;
DROP POLICY IF EXISTS "Users can insert their own breadcrumbs" ON public.dev_breadcrumbs;
DROP POLICY IF EXISTS "Users can update their own breadcrumbs" ON public.dev_breadcrumbs;
DROP POLICY IF EXISTS "Service role full access" ON public.dev_breadcrumbs;
DROP POLICY IF EXISTS "dev_breadcrumbs_select_own" ON public.dev_breadcrumbs;
DROP POLICY IF EXISTS "dev_breadcrumbs_insert_own" ON public.dev_breadcrumbs;
DROP POLICY IF EXISTS "dev_breadcrumbs_update_own" ON public.dev_breadcrumbs;

-- Create new policies using user_id
CREATE POLICY "dev_breadcrumbs_insert_own"
ON public.dev_breadcrumbs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "dev_breadcrumbs_select_own"
ON public.dev_breadcrumbs
FOR SELECT
TO authenticated
USING (user_id = auth.uid());