"use server";

import {
  buildExpenseEntry,
  buildIncomeEntry,
  type JournalLineInput,
} from "@/lib/accounting/journal-engine";
import { ensureAccountingSetup } from "@/lib/services/accounting-setup";
import { syncProjectCashFlowsFromAccounting } from "@/lib/services/accounting-project-bridge";
import { getSessionContext } from "@/lib/services/session-context";

export interface TransactionInput {
  entry_date: string;
  description: string;
  amount: number;
  category_id: string;
  contact_id?: string | null;
  project_id?: string | null;
  reference?: string;
}

export interface JournalEntryRow {
  id: string;
  entry_date: string;
  description: string;
  reference: string;
  transaction_type: string;
  status: string;
  amount: number;
  project_id: string | null;
  contact_id: string | null;
  created_at: string;
  contacts?: { name: string } | null;
  projects?: { name: string } | null;
}

async function getAccountLookup(tenantId: string) {
  const { supabase } = await getSessionContext();
  const { data, error } = await supabase
    .from("chart_of_accounts")
    .select("id, code")
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  if (error) throw error;
  return data;
}

async function insertJournalEntry(
  tenantId: string,
  userId: string,
  entry: {
    entry_date: string;
    description: string;
    reference?: string;
    transaction_type: string;
    amount: number;
    project_id?: string | null;
    contact_id?: string | null;
  },
  lines: JournalLineInput[],
) {
  const { supabase } = await getSessionContext();

  const { data: journalEntry, error: entryError } = await supabase
    .from("journal_entries")
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      ...entry,
      status: "posted",
    })
    .select("id")
    .single();

  if (entryError) throw entryError;

  const linesPayload = lines.map((line) => ({
    journal_entry_id: journalEntry.id,
    account_id: line.accountId,
    debit: line.debit,
    credit: line.credit,
    description: line.description ?? "",
  }));

  const { error: linesError } = await supabase
    .from("journal_entry_lines")
    .insert(linesPayload);

  if (linesError) throw linesError;

  return journalEntry.id;
}

export async function recordIncome(input: TransactionInput) {
  await ensureAccountingSetup();
  const { supabase, user, tenantId } = await getSessionContext();
  if (!tenantId) throw new Error("Tenant no configurado");

  const { data: category, error: catError } = await supabase
    .from("transaction_categories")
    .select("account_id")
    .eq("id", input.category_id)
    .eq("tenant_id", tenantId)
    .single();

  if (catError) throw catError;

  const accounts = await getAccountLookup(tenantId);
  const lines = buildIncomeEntry(accounts, input.amount, category.account_id);

  const entryId = await insertJournalEntry(
    tenantId,
    user.id,
    {
      entry_date: input.entry_date,
      description: input.description,
      reference: input.reference,
      transaction_type: "income",
      amount: input.amount,
      project_id: input.project_id,
      contact_id: input.contact_id,
    },
    lines,
  );

  if (input.project_id) {
    await syncProjectCashFlowsFromAccounting(input.project_id);
  }

  return entryId;
}

export async function recordExpense(input: TransactionInput) {
  await ensureAccountingSetup();
  const { supabase, user, tenantId } = await getSessionContext();
  if (!tenantId) throw new Error("Tenant no configurado");

  const { data: category, error: catError } = await supabase
    .from("transaction_categories")
    .select("account_id")
    .eq("id", input.category_id)
    .eq("tenant_id", tenantId)
    .single();

  if (catError) throw catError;

  const accounts = await getAccountLookup(tenantId);
  const lines = buildExpenseEntry(accounts, input.amount, category.account_id);

  const entryId = await insertJournalEntry(
    tenantId,
    user.id,
    {
      entry_date: input.entry_date,
      description: input.description,
      reference: input.reference,
      transaction_type: "expense",
      amount: input.amount,
      project_id: input.project_id,
      contact_id: input.contact_id,
    },
    lines,
  );

  if (input.project_id) {
    await syncProjectCashFlowsFromAccounting(input.project_id);
  }

  return entryId;
}

export async function fetchTransactions(filters?: {
  type?: "income" | "expense";
  project_id?: string;
  from?: string;
  to?: string;
}) {
  await ensureAccountingSetup();
  const { supabase, tenantId } = await getSessionContext();
  if (!tenantId) throw new Error("Tenant no configurado");

  let query = supabase
    .from("journal_entries")
    .select(
      "id, entry_date, description, reference, transaction_type, status, amount, project_id, contact_id, created_at, contacts(name), projects(name)",
    )
    .eq("tenant_id", tenantId)
    .eq("status", "posted")
    .in("transaction_type", ["income", "expense"])
    .order("entry_date", { ascending: false });

  if (filters?.type) {
    query = query.eq("transaction_type", filters.type);
  }
  if (filters?.project_id) {
    query = query.eq("project_id", filters.project_id);
  }
  if (filters?.from) {
    query = query.gte("entry_date", filters.from);
  }
  if (filters?.to) {
    query = query.lte("entry_date", filters.to);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...row,
    contacts: Array.isArray(row.contacts) ? row.contacts[0] ?? null : row.contacts,
    projects: Array.isArray(row.projects) ? row.projects[0] ?? null : row.projects,
  })) as JournalEntryRow[];
}

export async function voidTransaction(entryId: string, reason?: string) {
  const { supabase, tenantId } = await getSessionContext();
  if (!tenantId) throw new Error("Tenant no configurado");

  const { data: entry, error: fetchError } = await supabase
    .from("journal_entries")
    .select("project_id")
    .eq("id", entryId)
    .eq("tenant_id", tenantId)
    .single();

  if (fetchError) throw fetchError;

  const { error } = await supabase
    .from("journal_entries")
    .update({
      status: "void",
      voided_at: new Date().toISOString(),
      void_reason: reason ?? "Anulado por el usuario",
    })
    .eq("id", entryId);

  if (error) throw error;

  if (entry.project_id) {
    await syncProjectCashFlowsFromAccounting(entry.project_id);
  }

  return true;
}

export async function fetchAccountingSummary() {
  await ensureAccountingSetup();
  const { supabase, tenantId } = await getSessionContext();
  if (!tenantId) throw new Error("Tenant no configurado");

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const { data: entries, error } = await supabase
    .from("journal_entries")
    .select("transaction_type, amount, entry_date")
    .eq("tenant_id", tenantId)
    .eq("status", "posted")
    .gte("entry_date", monthStart);

  if (error) throw error;

  let monthIncome = 0;
  let monthExpense = 0;

  for (const e of entries ?? []) {
    if (e.transaction_type === "income") monthIncome += Number(e.amount);
    if (e.transaction_type === "expense") monthExpense += Number(e.amount);
  }

  const { count: unreconciled } = await supabase
    .from("bank_transactions")
    .select("id", { count: "exact", head: true })
    .is("reconciled_journal_entry_id", null);

  const { count: draftInvoices } = await supabase
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("status", "draft");

  return {
    monthIncome,
    monthExpense,
    monthProfit: monthIncome - monthExpense,
    unreconciledCount: unreconciled ?? 0,
    draftInvoicesCount: draftInvoices ?? 0,
  };
}
