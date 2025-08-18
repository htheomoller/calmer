# Supabase Audit Report

## Overview
This audit scanned the Supabase configuration and identified which components are actively used vs unused in the current codebase.

## Files Analyzed
- `supabase/config.toml` - Project configuration
- `database_migration.sql` - Main database schema and data
- `supabase/functions/chat/index.ts` - Chat edge function
- `src/integrations/supabase/types.ts` - TypeScript types
- `src/integrations/supabase/client.ts` - Client configuration  
- `src/lib/supabase.ts` - Legacy client (duplicate)

## Tables Status

### USED Tables
These tables are actively referenced in the application code:

- **blog_posts** - USED
  - Referenced in: `src/pages/Resources.tsx:29`, `src/pages/ResourceCategory.tsx:29`, `src/pages/ResourcePost.tsx:31`
  - Used for: Blog/resource content display system
  - Status: Actively used in Resource pages

- **accounts** - USED
  - Migration: `supabase/migrations/20250118000000_mvp_schema.sql:7-13`
  - Used for: User account settings and automation configuration
  - Status: Core MVP table

- **posts** - USED  
  - Migration: `supabase/migrations/20250118000000_mvp_schema.sql:15-24`
  - Used for: Instagram post tracking and automation rules
  - Status: Core MVP table

- **events** - USED
  - Migration: `supabase/migrations/20250118000000_mvp_schema.sql:26-35`
  - Used for: Activity logging and analytics
  - Status: Core MVP table

### UNUSED Tables  
These tables have no code references and appear to be for features not yet implemented:

- **reply_logs** - UNUSED
  - No references found in src/ code
  - Part of Instagram reply automation system (not implemented)

- **reply_rules** - UNUSED  
  - No references found in src/ code
  - Part of Instagram reply automation system (not implemented)

- **reply_templates** - UNUSED
  - No references found in src/ code  
  - Part of Instagram reply automation system (not implemented)

- **social_accounts** - UNUSED
  - No references found in src/ code
  - Part of Instagram reply automation system (not implemented)

### MAYBE Tables
These tables are defined in database_migration.sql but not yet used in current MVP:

- **profiles** - MAYBE
  - Defined in database_migration.sql:5-16
  - Has trigger setup for user signup
  - Needed for user management (MVP requirement)

- **chat_messages** - MAYBE  
  - Defined in database_migration.sql:19-25
  - Referenced in supabase/functions/chat/index.ts:40,92
  - Used by chat edge function (MVP requirement)

- **daily_plan_templates** - MAYBE
  - Defined in database_migration.sql:28-36
  - Has sample data inserted  
  - Core feature for daily planning (MVP requirement)

- **user_daily_plans** - MAYBE
  - Defined in database_migration.sql:39-46
  - Core feature for daily planning (MVP requirement)

- **user_progress** - MAYBE
  - Defined in database_migration.sql:49-56  
  - Core feature for progress tracking (MVP requirement)

- **waitlist** - MAYBE
  - Defined in database_migration.sql:59-64
  - Has RLS policy for public access
  - Referenced in landing pages but only in TODOs (not implemented)

## Functions Status

### USED Functions
- **handle_new_user()** - USED
  - Defined in database_migration.sql:173-180
  - Has trigger setup in database_migration.sql:183-185
  - Essential for user management

### MAYBE Functions  
- **cleanup_old_messages()** - MAYBE
  - Defined in database_migration.sql:188-194
  - No active calls found, but useful for maintenance

- **generate_daily_plan_for_user()** - MAYBE  
  - Defined in database_migration.sql:197-229
  - Core function for daily planning feature

## Edge Functions Status

### USED Edge Functions
- **chat** - USED
  - File: supabase/functions/chat/index.ts
  - References chat_messages table
  - Active chat functionality

## Configuration Status

### USED Configuration
- **supabase/config.toml** - USED
  - Contains project_id configuration
  - Required for Supabase connection

### UNUSED Client Files
- **src/lib/supabase.ts** - UNUSED
  - Legacy client using env variables
  - Superseded by src/integrations/supabase/client.ts
  - Uses deprecated VITE_ env pattern

## Configuration Management

### Public Configuration
- Location: `src/config/public.ts`
- Contains: Supabase URL, Supabase anon key (safe for client-side)
- Usage: Import from this centralized file instead of hardcoding values

### Secrets Management
- Location: `src/config/secrets.ts` (helpers for edge functions)
- Current secrets: OPENAI_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_DB_URL
- Future secrets: SINCH_PROJECT_ID, SINCH_API_KEY, SINCH_API_SECRET, SINCH_REGION, IG_CHANNEL_ID
- Add secrets via Supabase Dashboard → Settings → Edge Functions
- Available in edge functions via `Deno.env.get()`

### Health Check
- Route: `/health` (development only)
- Shows status of public config and expected secrets
- No actual values displayed, only presence/absence indicators

## Actions Taken
- Archived unused Instagram automation tables (reply_logs, reply_rules, reply_templates, social_accounts)
- Archived legacy Supabase client (src/lib/supabase.ts)
- Kept all MAYBE items in place as they are needed for MVP features
- Kept all authentication and core functionality intact

## Security Notes
- All auth.users table references preserved
- Row Level Security policies maintained
- No changes to database behavior or runtime code

## Security Token Removal

**Date: 2025-01-18**

Sensitive OAuth tokens were removed from the `social_accounts` table to fix EXPOSED_SENSITIVE_DATA security warning:

- **Removed columns**: `access_token`, `token_expires_at` 
- **Added safe columns**: `provider`, `username`, `external_id`, `status`
- **Archive location**: `supabase/_archive/social_accounts_redacted_20250118.sql` (tokens redacted)
- **Future plan**: OAuth tokens will be stored securely via Sinch or external vault service

The `social_accounts` table now only stores safe identifiers and metadata. RLS policies updated to allow user access to their own accounts.