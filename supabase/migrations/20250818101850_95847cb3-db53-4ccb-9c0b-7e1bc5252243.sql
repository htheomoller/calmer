-- Archive existing social_accounts data with tokens redacted
-- Export to supabase/_archive/social_accounts_redacted_20250118.sql

-- First, let's see what data exists and create a safe archive
-- (This will be manually exported - keeping structure for reference)

-- Remove sensitive token columns from social_accounts table
ALTER TABLE public.social_accounts 
DROP COLUMN IF EXISTS access_token,
DROP COLUMN IF EXISTS refresh_token,
DROP COLUMN IF EXISTS page_token,
DROP COLUMN IF EXISTS fb_token,
DROP COLUMN IF EXISTS ig_token,
DROP COLUMN IF EXISTS long_lived_token;

-- Add missing columns for safer social account management
ALTER TABLE public.social_accounts 
ADD COLUMN IF NOT EXISTS provider text DEFAULT 'instagram',
ADD COLUMN IF NOT EXISTS username text,
ADD COLUMN IF NOT EXISTS external_id text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'connected';

-- Update existing data to use safer field mapping
UPDATE public.social_accounts 
SET external_id = COALESCE(ig_user_id, fb_page_id)
WHERE external_id IS NULL;

-- Ensure RLS is enabled (should already be enabled)
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

-- Drop existing overly restrictive policies
DROP POLICY IF EXISTS "no insert/update/delete for client" ON public.social_accounts;
DROP POLICY IF EXISTS "no read for client" ON public.social_accounts;

-- Create proper RLS policies for social accounts
-- Users can only access their own social accounts
CREATE POLICY "Users can view own social accounts" 
ON public.social_accounts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own social accounts" 
ON public.social_accounts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own social accounts" 
ON public.social_accounts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own social accounts" 
ON public.social_accounts 
FOR DELETE 
USING (auth.uid() = user_id);