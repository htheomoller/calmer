-- Create webhook_events table for persistent deduplication and rate limiting
create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  comment_id text not null,
  created_at timestamp with time zone not null default now()
);

-- One comment_id should never be processed twice (global dedup)
create unique index if not exists webhook_events_comment_id_key
  on public.webhook_events (comment_id);

-- Speed up per-account, recent-window queries
create index if not exists webhook_events_account_recent_idx
  on public.webhook_events (account_id, created_at desc);

-- RLS: service-role (edge) writes; no client writes
alter table public.webhook_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'webhook_events'
      and policyname = 'no_direct_access'
  ) then
    create policy "no_direct_access"
    on public.webhook_events
    for all
    using (false);
  end if;
end$$;