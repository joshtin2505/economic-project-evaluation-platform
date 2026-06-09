-- Update RLS policies to support tenant isolation

-- DROP existing policies if present
drop policy if exists "Users can read own projects" on public.projects;
drop policy if exists "Users can create own projects" on public.projects;
drop policy if exists "Users can update own projects" on public.projects;
drop policy if exists "Users can delete own projects" on public.projects;

create policy "Users can read projects in their tenant or own projects"
on public.projects
for select
using (
  (user_id = auth.uid()) OR (
    tenant_id is not null AND exists (
      select 1 from public.user_profiles up where up.id = auth.uid() and up.tenant_id = public.projects.tenant_id
    )
  )
);

create policy "Users can create own projects"
on public.projects
for insert
with check (
  (user_id = auth.uid()) OR (
    tenant_id is not null AND exists (
      select 1 from public.user_profiles up where up.id = auth.uid() and up.tenant_id = public.projects.tenant_id
    )
  )
);

create policy "Users can update projects in their tenant or own projects"
on public.projects
for update
using (
  (user_id = auth.uid()) OR (
    tenant_id is not null AND exists (
      select 1 from public.user_profiles up where up.id = auth.uid() and up.tenant_id = public.projects.tenant_id
    )
  )
)
with check (
  (user_id = auth.uid()) OR (
    tenant_id is not null AND exists (
      select 1 from public.user_profiles up where up.id = auth.uid() and up.tenant_id = public.projects.tenant_id
    )
  )
);

create policy "Users can delete projects in their tenant or own projects"
on public.projects
for delete
using (
  (user_id = auth.uid()) OR (
    tenant_id is not null AND exists (
      select 1 from public.user_profiles up where up.id = auth.uid() and up.tenant_id = public.projects.tenant_id
    )
  )
);

-- Cash flows policies (check project tenant or ownership)
drop policy if exists "Users can read own cash flows" on public.cash_flows;
drop policy if exists "Users can insert own cash flows" on public.cash_flows;
drop policy if exists "Users can update own cash flows" on public.cash_flows;
drop policy if exists "Users can delete own cash flows" on public.cash_flows;

create policy "Users can read cash flows for projects in their tenant or own projects"
on public.cash_flows
for select
using (
  exists (
    select 1 from public.projects p where p.id = public.cash_flows.project_id and (
      p.user_id = auth.uid() OR (
        p.tenant_id is not null AND exists (
          select 1 from public.user_profiles up where up.id = auth.uid() and up.tenant_id = p.tenant_id
        )
      )
    )
  )
);

create policy "Users can insert cash flows for projects in their tenant or own projects"
on public.cash_flows
for insert
with check (
  exists (
    select 1 from public.projects p where p.id = public.cash_flows.project_id and (
      p.user_id = auth.uid() OR (
        p.tenant_id is not null AND exists (
          select 1 from public.user_profiles up where up.id = auth.uid() and up.tenant_id = p.tenant_id
        )
      )
    )
  )
);

create policy "Users can update cash flows for projects in their tenant or own projects"
on public.cash_flows
for update
using (
  exists (
    select 1 from public.projects p where p.id = public.cash_flows.project_id and (
      p.user_id = auth.uid() OR (
        p.tenant_id is not null AND exists (
          select 1 from public.user_profiles up where up.id = auth.uid() and up.tenant_id = p.tenant_id
        )
      )
    )
  )
)
with check (
  exists (
    select 1 from public.projects p where p.id = public.cash_flows.project_id and (
      p.user_id = auth.uid() OR (
        p.tenant_id is not null AND exists (
          select 1 from public.user_profiles up where up.id = auth.uid() and up.tenant_id = p.tenant_id
        )
      )
    )
  )
);

create policy "Users can delete cash flows for projects in their tenant or own projects"
on public.cash_flows
for delete
using (
  exists (
    select 1 from public.projects p where p.id = public.cash_flows.project_id and (
      p.user_id = auth.uid() OR (
        p.tenant_id is not null AND exists (
          select 1 from public.user_profiles up where up.id = auth.uid() and up.tenant_id = p.tenant_id
        )
      )
    )
  )
);
