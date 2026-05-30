-- TMAR method and funding sources for project form
alter table public.projects
  add column if not exists tmar_method text not null default 'simple'
    check (tmar_method in ('simple', 'mixta'));

alter table public.projects
  add column if not exists funding_sources jsonb not null default '[]'::jsonb;
