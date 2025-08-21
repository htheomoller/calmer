-- Add test_window column (nullable) to group calls by self-test run
alter table if exists public.webhook_events
  add column if not exists test_window text;

-- Optional: record provider (e.g., 'sandbox') for debugging/filters
alter table if exists public.webhook_events
  add column if not exists provider text;

-- Helpful composite index for fast windowed counts
create index if not exists idx_webhook_events_window
  on public.webhook_events (account_id, test_window, created_at desc);