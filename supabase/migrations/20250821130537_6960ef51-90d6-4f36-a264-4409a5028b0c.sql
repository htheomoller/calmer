-- Create atomic per-minute rate counter table
create table if not exists public.rate_counters (
  account_id uuid not null,
  bucket_start timestamptz not null,
  hits integer not null default 0,
  constraint rate_counters_pkey primary key (account_id, bucket_start)
);

-- No RLS needed - only service role will access this table