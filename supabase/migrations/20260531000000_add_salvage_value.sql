-- Add salvage_value column to projects table
alter table public.projects 
add column if not exists salvage_value numeric not null default 0;

-- Add use_tmar_as_discount_rate column if it doesn't exist
alter table public.projects 
add column if not exists use_tmar_as_discount_rate boolean not null default false;
