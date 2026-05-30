-- User profile and calculation defaults (run after schema.sql)
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
