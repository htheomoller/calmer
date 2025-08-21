-- Create webhook events table for persistent deduplication and rate limiting
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL,
  comment_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fast dedupe lookup on comment_id
CREATE UNIQUE INDEX IF NOT EXISTS webhook_events_comment_id_uq
  ON public.webhook_events (comment_id);

-- Fast rate-limit window by account+time  
CREATE INDEX IF NOT EXISTS webhook_events_account_time_idx
  ON public.webhook_events (account_id, created_at DESC);

-- Enable RLS (edge functions use service role and bypass RLS, but keep table safe by default)
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- No direct access policy - edge functions bypass RLS anyway
CREATE POLICY "no_direct_access" ON public.webhook_events FOR ALL USING (false);