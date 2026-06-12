-- Accounting module: chart of accounts, journal entries, contacts, invoices, banks
-- Also backfill tenant_id on projects and extend cash_flows

-- Backfill tenant_id on existing projects from user_profiles
update public.projects p
set tenant_id = up.tenant_id
from public.user_profiles up
where p.user_id = up.id
  and p.tenant_id is null
  and up.tenant_id is not null;

-- Extend cash_flows with source tracking
alter table public.cash_flows
  add column if not exists source text not null default 'manual'
    check (source in ('manual', 'from_accounting'));

-- Chart of accounts (PUC simplified)
create table if not exists public.chart_of_accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  code text not null,
  name text not null,
  account_type text not null check (account_type in ('asset', 'liability', 'equity', 'income', 'expense')),
  parent_code text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tenant_id, code)
);

create index if not exists chart_of_accounts_tenant_idx on public.chart_of_accounts(tenant_id);

-- Transaction categories mapping business language to accounts
create table if not exists public.transaction_categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  category_type text not null check (category_type in ('income', 'expense')),
  account_id uuid not null references public.chart_of_accounts(id) on delete restrict,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique (tenant_id, name, category_type)
);

create index if not exists transaction_categories_tenant_idx on public.transaction_categories(tenant_id);

-- Contacts (customers & suppliers)
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_type text not null default 'customer' check (contact_type in ('customer', 'supplier', 'both')),
  tax_id text default '',
  name text not null,
  email text default '',
  phone text default '',
  address text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contacts_tenant_idx on public.contacts(tenant_id);

-- Journal entries (double-entry header)
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null default current_date,
  description text not null default '',
  reference text default '',
  project_id uuid references public.projects(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  transaction_type text not null default 'income' check (
    transaction_type in ('income', 'expense', 'invoice_sale', 'invoice_purchase', 'payment', 'transfer', 'adjustment')
  ),
  status text not null default 'posted' check (status in ('posted', 'void')),
  amount numeric not null default 0,
  voided_at timestamptz,
  void_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists journal_entries_tenant_idx on public.journal_entries(tenant_id);
create index if not exists journal_entries_date_idx on public.journal_entries(entry_date);
create index if not exists journal_entries_project_idx on public.journal_entries(project_id);

-- Journal entry lines (debit/credit)
create table if not exists public.journal_entry_lines (
  id uuid primary key default gen_random_uuid(),
  journal_entry_id uuid not null references public.journal_entries(id) on delete cascade,
  account_id uuid not null references public.chart_of_accounts(id) on delete restrict,
  debit numeric not null default 0 check (debit >= 0),
  credit numeric not null default 0 check (credit >= 0),
  description text default '',
  created_at timestamptz not null default now()
);

create index if not exists journal_entry_lines_entry_idx on public.journal_entry_lines(journal_entry_id);

-- Invoices (sales & purchases)
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  invoice_type text not null check (invoice_type in ('sale', 'purchase')),
  status text not null default 'draft' check (status in ('draft', 'issued', 'paid', 'void')),
  invoice_number text default '',
  issue_date date not null default current_date,
  due_date date,
  subtotal numeric not null default 0,
  tax_amount numeric not null default 0,
  total numeric not null default 0,
  notes text default '',
  project_id uuid references public.projects(id) on delete set null,
  journal_entry_id uuid references public.journal_entries(id) on delete set null,
  payment_journal_entry_id uuid references public.journal_entries(id) on delete set null,
  dian_cufe text,
  dian_status text default 'pending' check (dian_status in ('pending', 'submitted', 'accepted', 'rejected', 'not_applicable')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invoices_tenant_idx on public.invoices(tenant_id);

-- Invoice line items
create table if not exists public.invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null default '',
  quantity numeric not null default 1,
  unit_price numeric not null default 0,
  tax_rate numeric not null default 0.19,
  line_total numeric not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists invoice_lines_invoice_idx on public.invoice_lines(invoice_id);

-- Bank accounts
create table if not exists public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  bank_name text default '',
  account_number text default '',
  currency text not null default 'cop',
  opening_balance numeric not null default 0,
  chart_account_id uuid references public.chart_of_accounts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bank_accounts_tenant_idx on public.bank_accounts(tenant_id);

-- Bank transactions (CSV import & reconciliation)
create table if not exists public.bank_transactions (
  id uuid primary key default gen_random_uuid(),
  bank_account_id uuid not null references public.bank_accounts(id) on delete cascade,
  transaction_date date not null,
  description text not null default '',
  amount numeric not null,
  balance_after numeric,
  external_id text,
  import_batch_id uuid,
  reconciled_journal_entry_id uuid references public.journal_entries(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists bank_transactions_account_idx on public.bank_transactions(bank_account_id);
create index if not exists bank_transactions_date_idx on public.bank_transactions(transaction_date);

-- RLS helper: tenant access check
create or replace function public.user_has_tenant_access(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_profiles up
    where up.id = auth.uid() and up.tenant_id = p_tenant_id
  );
$$;

-- Enable RLS
alter table public.chart_of_accounts enable row level security;
alter table public.transaction_categories enable row level security;
alter table public.contacts enable row level security;
alter table public.journal_entries enable row level security;
alter table public.journal_entry_lines enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_lines enable row level security;
alter table public.bank_accounts enable row level security;
alter table public.bank_transactions enable row level security;

-- chart_of_accounts policies
create policy "Tenant members can read chart of accounts"
  on public.chart_of_accounts for select
  using (public.user_has_tenant_access(tenant_id));

create policy "Tenant members can manage chart of accounts"
  on public.chart_of_accounts for all
  using (public.user_has_tenant_access(tenant_id))
  with check (public.user_has_tenant_access(tenant_id));

-- transaction_categories policies
create policy "Tenant members can read categories"
  on public.transaction_categories for select
  using (public.user_has_tenant_access(tenant_id));

create policy "Tenant members can manage categories"
  on public.transaction_categories for all
  using (public.user_has_tenant_access(tenant_id))
  with check (public.user_has_tenant_access(tenant_id));

-- contacts policies
create policy "Tenant members can read contacts"
  on public.contacts for select
  using (public.user_has_tenant_access(tenant_id));

create policy "Tenant members can manage contacts"
  on public.contacts for all
  using (public.user_has_tenant_access(tenant_id))
  with check (public.user_has_tenant_access(tenant_id) and user_id = auth.uid());

-- journal_entries policies
create policy "Tenant members can read journal entries"
  on public.journal_entries for select
  using (public.user_has_tenant_access(tenant_id));

create policy "Tenant members can manage journal entries"
  on public.journal_entries for all
  using (public.user_has_tenant_access(tenant_id))
  with check (public.user_has_tenant_access(tenant_id) and user_id = auth.uid());

-- journal_entry_lines policies (via parent entry)
create policy "Tenant members can read journal lines"
  on public.journal_entry_lines for select
  using (exists (
    select 1 from public.journal_entries je
    where je.id = journal_entry_id and public.user_has_tenant_access(je.tenant_id)
  ));

create policy "Tenant members can manage journal lines"
  on public.journal_entry_lines for all
  using (exists (
    select 1 from public.journal_entries je
    where je.id = journal_entry_id and public.user_has_tenant_access(je.tenant_id)
  ))
  with check (exists (
    select 1 from public.journal_entries je
    where je.id = journal_entry_id and public.user_has_tenant_access(je.tenant_id)
  ));

-- invoices policies
create policy "Tenant members can read invoices"
  on public.invoices for select
  using (public.user_has_tenant_access(tenant_id));

create policy "Tenant members can manage invoices"
  on public.invoices for all
  using (public.user_has_tenant_access(tenant_id))
  with check (public.user_has_tenant_access(tenant_id) and user_id = auth.uid());

-- invoice_lines policies
create policy "Tenant members can read invoice lines"
  on public.invoice_lines for select
  using (exists (
    select 1 from public.invoices i
    where i.id = invoice_id and public.user_has_tenant_access(i.tenant_id)
  ));

create policy "Tenant members can manage invoice lines"
  on public.invoice_lines for all
  using (exists (
    select 1 from public.invoices i
    where i.id = invoice_id and public.user_has_tenant_access(i.tenant_id)
  ))
  with check (exists (
    select 1 from public.invoices i
    where i.id = invoice_id and public.user_has_tenant_access(i.tenant_id)
  ));

-- bank_accounts policies
create policy "Tenant members can read bank accounts"
  on public.bank_accounts for select
  using (public.user_has_tenant_access(tenant_id));

create policy "Tenant members can manage bank accounts"
  on public.bank_accounts for all
  using (public.user_has_tenant_access(tenant_id))
  with check (public.user_has_tenant_access(tenant_id) and user_id = auth.uid());

-- bank_transactions policies
create policy "Tenant members can read bank transactions"
  on public.bank_transactions for select
  using (exists (
    select 1 from public.bank_accounts ba
    where ba.id = bank_account_id and public.user_has_tenant_access(ba.tenant_id)
  ));

create policy "Tenant members can manage bank transactions"
  on public.bank_transactions for all
  using (exists (
    select 1 from public.bank_accounts ba
    where ba.id = bank_account_id and public.user_has_tenant_access(ba.tenant_id)
  ))
  with check (exists (
    select 1 from public.bank_accounts ba
    where ba.id = bank_account_id and public.user_has_tenant_access(ba.tenant_id)
  ));
