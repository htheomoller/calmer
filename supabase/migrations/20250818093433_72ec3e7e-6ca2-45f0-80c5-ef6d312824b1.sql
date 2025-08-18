-- Calmer MVP Schema
-- Clean schema with only the tables needed for MVP functionality

-- Accounts table
CREATE TABLE public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  default_link text,
  reply_to_comments boolean DEFAULT true,
  comment_limit integer DEFAULT 200,
  dm_template text DEFAULT 'Thanks! Here''s the link: {link}',
  created_at timestamptz DEFAULT now()
);

-- Posts table  
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ig_post_id text UNIQUE,
  caption text,
  code text,
  link text,
  automation_enabled boolean DEFAULT true,
  account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Events table
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text,
  ig_user text,
  ig_post_id text,
  comment_text text,
  matched boolean,
  sent_dm boolean,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for accounts
CREATE POLICY "Users can view own accounts" ON public.accounts 
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert own accounts" ON public.accounts 
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Users can update own accounts" ON public.accounts 
  FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can delete own accounts" ON public.accounts 
  FOR DELETE USING (auth.uid()::text = id::text);

-- RLS Policies for posts
CREATE POLICY "Users can view own posts" ON public.posts 
  FOR SELECT USING (
    account_id IN (SELECT id FROM public.accounts WHERE auth.uid()::text = id::text)
  );

CREATE POLICY "Users can insert own posts" ON public.posts 
  FOR INSERT WITH CHECK (
    account_id IN (SELECT id FROM public.accounts WHERE auth.uid()::text = id::text)
  );

CREATE POLICY "Users can update own posts" ON public.posts 
  FOR UPDATE USING (
    account_id IN (SELECT id FROM public.accounts WHERE auth.uid()::text = id::text)
  );

CREATE POLICY "Users can delete own posts" ON public.posts 
  FOR DELETE USING (
    account_id IN (SELECT id FROM public.accounts WHERE auth.uid()::text = id::text)
  );

-- RLS Policies for events (read-only for users)
CREATE POLICY "Users can view own events" ON public.events 
  FOR SELECT USING (
    ig_post_id IN (
      SELECT ig_post_id FROM public.posts p
      JOIN public.accounts a ON p.account_id = a.id
      WHERE auth.uid()::text = a.id::text
    )
  );

-- Create indexes for performance
CREATE INDEX idx_posts_ig_post_id ON public.posts(ig_post_id);
CREATE INDEX idx_posts_account_id ON public.posts(account_id);
CREATE INDEX idx_events_ig_post_id ON public.events(ig_post_id);
CREATE INDEX idx_events_created_at ON public.events(created_at);