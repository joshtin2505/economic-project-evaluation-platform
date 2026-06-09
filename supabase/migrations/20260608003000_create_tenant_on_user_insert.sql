-- Create tenant and user_profile when a new auth.user is inserted
create or replace function public.create_tenant_and_profile()
returns trigger
language plpgsql
security definer
as $$
declare
  t_id uuid;
  display text := coalesce(new.user_metadata->> 'full_name', split_part(new.email, '@', 1));
  tenant_slug text := lower(regexp_replace(split_part(new.email, '@', 2), '[^a-z0-9]+', '-', 'g'));
begin
  -- Create a tenant for the new user
  insert into public.tenants (name, slug)
    values (display, tenant_slug)
    returning id into t_id;

  -- Create a user_profiles row linked to the created tenant
  insert into public.user_profiles (id, display_name, company, role, tenant_id)
    values (new.id, display, '', '', t_id)
    on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists create_tenant_and_profile_trigger on auth.users;
create trigger create_tenant_and_profile_trigger
after insert on auth.users
for each row
execute function public.create_tenant_and_profile();
