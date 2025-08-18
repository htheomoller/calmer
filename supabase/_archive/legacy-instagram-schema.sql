-- ARCHIVED: Instagram reply automation tables
-- These were not referenced in the current codebase
-- Moved to archive on 2025-01-18

-- Reply logs table
CREATE TABLE public.reply_logs (
  user_id uuid NOT NULL,
  matched_rule_id uuid,
  status USER-DEFINED NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  ig_comment_id text,
  sent_text text,
  error text,
  ig_media_id text,
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4()
);

-- Reply rules table  
CREATE TABLE public.reply_rules (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL,
  match_type USER-DEFINED NOT NULL DEFAULT 'ALL'::rule_match_type,
  keyword text,
  template_id uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Reply templates table
CREATE TABLE public.reply_templates (
  name text NOT NULL,
  body text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL
);

-- Social accounts table
CREATE TABLE public.social_accounts (
  token_expires_at timestamp with time zone,
  ig_user_id text NOT NULL,
  fb_page_id text,
  access_token text NOT NULL,
  user_id uuid NOT NULL,
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  connected_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS Policies for reply_logs
ALTER TABLE public.reply_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logs no client write" ON public.reply_logs AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "logs select own" ON public.reply_logs FOR SELECT USING (user_id = auth.uid());

-- RLS Policies for reply_rules  
ALTER TABLE public.reply_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rules delete own" ON public.reply_rules FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "rules select own" ON public.reply_rules FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "rules update own" ON public.reply_rules FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "rules write own" ON public.reply_rules FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for reply_templates
ALTER TABLE public.reply_templates ENABLE ROW LEVEL SECURITY;  
CREATE POLICY "templates delete own" ON public.reply_templates FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "templates insert own" ON public.reply_templates FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "templates select own" ON public.reply_templates FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "templates update own" ON public.reply_templates FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for social_accounts
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "no insert/update/delete for client" ON public.social_accounts AS RESTRICTIVE FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "no read for client" ON public.social_accounts FOR SELECT USING (false);

-- Foreign key relationships
ALTER TABLE reply_logs ADD CONSTRAINT reply_logs_matched_rule_id_fkey FOREIGN KEY (matched_rule_id) REFERENCES reply_rules(id);
ALTER TABLE reply_rules ADD CONSTRAINT reply_rules_template_id_fkey FOREIGN KEY (template_id) REFERENCES reply_templates(id);

-- Enums
CREATE TYPE reply_status AS ENUM ('pending', 'sent', 'failed');
CREATE TYPE rule_match_type AS ENUM ('ALL', 'CONTAINS', 'EXACT');