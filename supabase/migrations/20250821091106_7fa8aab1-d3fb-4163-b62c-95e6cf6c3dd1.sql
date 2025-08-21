-- Table: public.dev_breadcrumbs
create table if not exists public.dev_breadcrumbs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  scope text not null,
  summary text not null,
  details jsonb,
  tags text[],
  at timestamptz not null default now()
);

-- Ensure extensions used above
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- RLS on
alter table public.dev_breadcrumbs enable row level security;

-- Drop old policies if they exist (idempotent)
do $$
begin
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'dev_breadcrumbs' and policyname = 'dev_breadcrumbs_insert_own') then
    drop policy "dev_breadcrumbs_insert_own" on public.dev_breadcrumbs;
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'dev_breadcrumbs' and policyname = 'dev_breadcrumbs_select_own') then
    drop policy "dev_breadcrumbs_select_own" on public.dev_breadcrumbs;
  end if;
end$$;

-- Authenticated users can INSERT; user_id defaults to auth.uid()
create policy "dev_breadcrumbs_insert_own"
on public.dev_breadcrumbs
for insert
to authenticated
with check (auth.uid() is not null);

-- Authenticated users can SELECT only their own rows
create policy "dev_breadcrumbs_select_own"
on public.dev_breadcrumbs
for select
to authenticated
using (user_id = auth.uid());