-- Core project data
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text default '',
  initial_investment numeric not null default 0,
  periods integer not null default 1,
  discount_rate numeric not null default 0,
  inflation numeric not null default 0,
  risk_premium numeric not null default 0,
  status text not null default 'draft' check (status in ('draft', 'analyzing', 'completed')),
  results jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cash_flows (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  period integer not null,
  inflow numeric not null default 0,
  outflow numeric not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects(user_id);
create index if not exists cash_flows_project_id_idx on public.cash_flows(project_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

alter table public.projects enable row level security;
alter table public.cash_flows enable row level security;

-- Projects policies
create policy "Users can read own projects"
on public.projects
for select
using (auth.uid() = user_id);

create policy "Users can create own projects"
on public.projects
for insert
with check (auth.uid() = user_id);

create policy "Users can update own projects"
on public.projects
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own projects"
on public.projects
for delete
using (auth.uid() = user_id);

-- Cash flow policies linked to project ownership
create policy "Users can read own cash flows"
on public.cash_flows
for select
using (
  exists (
    select 1
    from public.projects p
    where p.id = cash_flows.project_id
      and p.user_id = auth.uid()
  )
);

create policy "Users can insert own cash flows"
on public.cash_flows
for insert
with check (
  exists (
    select 1
    from public.projects p
    where p.id = cash_flows.project_id
      and p.user_id = auth.uid()
  )
);

create policy "Users can update own cash flows"
on public.cash_flows
for update
using (
  exists (
    select 1
    from public.projects p
    where p.id = cash_flows.project_id
      and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.projects p
    where p.id = cash_flows.project_id
      and p.user_id = auth.uid()
  )
);

create policy "Users can delete own cash flows"
on public.cash_flows
for delete
using (
  exists (
    select 1
    from public.projects p
    where p.id = cash_flows.project_id
      and p.user_id = auth.uid()
  )
);

-- User preferences and calculation defaults
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text default '',
  company text default '',
  role text default '',
  default_discount_rate numeric not null default 12,
  default_periods integer not null default 10,
  default_risk_free_rate numeric not null default 4,
  default_inflation numeric not null default 3,
  default_risk_premium numeric not null default 5,
  irr_method text not null default 'newton' check (irr_method in ('newton', 'bisection', 'secant')),
  currency text not null default 'usd',
  number_format text not null default 'en-us',
  preferred_locale text not null default 'es',
  email_notifications boolean not null default false,
  project_updates_notifications boolean not null default true,
  weekly_summary_notifications boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists user_profiles_set_updated_at on public.user_profiles;
create trigger user_profiles_set_updated_at
before update on public.user_profiles
for each row
execute function public.set_updated_at();

alter table public.user_profiles enable row level security;

create policy "Users can read own profile"
on public.user_profiles
for select
using (auth.uid() = id);

create policy "Users can insert own profile"
on public.user_profiles
for insert
with check (auth.uid() = id);

create policy "Users can update own profile"
on public.user_profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);
