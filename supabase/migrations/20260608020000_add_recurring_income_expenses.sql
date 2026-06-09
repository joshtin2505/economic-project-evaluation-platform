-- Create income_sources and recurring_expenses tables with RLS policies
create table if not exists public.income_sources (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric not null default 0,
  frequency text not null default 'monthly' check (frequency in ('daily','weekly','monthly','quarterly','annual')),
  start_date date not null default now(),
  end_date date,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists income_sources_tenant_idx on public.income_sources(tenant_id);

create table if not exists public.recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric not null default 0,
  category text default '',
  frequency text not null default 'monthly' check (frequency in ('daily','weekly','monthly','quarterly','annual')),
  start_date date not null default now(),
  end_date date,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recurring_expenses_tenant_idx on public.recurring_expenses(tenant_id);

-- Note: RLS policies are defined in schema.sql
