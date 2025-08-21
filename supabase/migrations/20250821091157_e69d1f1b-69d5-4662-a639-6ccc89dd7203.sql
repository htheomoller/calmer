-- Clear existing dev_breadcrumbs data since it's dev/test data
DELETE FROM public.dev_breadcrumbs;

-- Add user_id column (now safe since table is empty)
ALTER TABLE public.dev_breadcrumbs 
ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL DEFAULT auth.uid();

-- Add at column if missing
ALTER TABLE public.dev_breadcrumbs 
ADD COLUMN IF NOT EXISTS at timestamptz DEFAULT now();

-- Drop all existing policies to clean slate
DROP POLICY IF EXISTS "Users can view their own breadcrumbs" ON public.dev_breadcrumbs;
DROP POLICY IF EXISTS "Users can insert their own breadcrumbs" ON public.dev_breadcrumbs;
DROP POLICY IF EXISTS "Users can update their own breadcrumbs" ON public.dev_breadcrumbs;
DROP POLICY IF EXISTS "Service role full access" ON public.dev_breadcrumbs;
DROP POLICY IF EXISTS "dev_breadcrumbs_select_own" ON public.dev_breadcrumbs;
DROP POLICY IF EXISTS "dev_breadcrumbs_insert_own" ON public.dev_breadcrumbs;
DROP POLICY IF EXISTS "dev_breadcrumbs_update_own" ON public.dev_breadcrumbs;

-- Create the correct policies for authenticated users
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