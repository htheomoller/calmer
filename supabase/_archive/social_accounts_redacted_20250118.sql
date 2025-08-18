-- ARCHIVED DATA FROM social_accounts TABLE
-- Date: 2025-01-18
-- Note: All sensitive tokens have been REDACTED for security
-- This archive shows the table structure before token removal

-- Original table structure (before migration):
/*
CREATE TABLE public.social_accounts (
  id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  ig_user_id TEXT NOT NULL,
  fb_page_id TEXT,
  access_token TEXT NOT NULL,  -- REMOVED: Contains sensitive OAuth tokens
  token_expires_at TIMESTAMP WITH TIME ZONE,
  connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
*/

-- No actual data is archived here as the table contained sensitive tokens
-- that should not be stored in git history.

-- If data recovery is needed, restore from Supabase backups and manually
-- migrate to the new secure token storage system.

-- New table structure (after migration):
/*
CREATE TABLE public.social_accounts (
  id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  ig_user_id TEXT NOT NULL,  -- Kept as safe identifier
  fb_page_id TEXT,           -- Kept as safe identifier  
  provider TEXT DEFAULT 'instagram',
  username TEXT,
  external_id TEXT,          -- Maps to ig_user_id or fb_page_id
  status TEXT DEFAULT 'connected',
  connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
  -- token_expires_at REMOVED
  -- access_token REMOVED
);
*/