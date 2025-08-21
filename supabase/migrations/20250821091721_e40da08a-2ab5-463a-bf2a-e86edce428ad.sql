-- Make author_email optional for sandbox/dev logging
alter table public.dev_breadcrumbs
  alter column author_email drop not null,
  alter column author_email set default null;