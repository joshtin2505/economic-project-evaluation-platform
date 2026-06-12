"use server";

import { randomUUID } from "crypto";
import { parseBankCsv } from "@/lib/accounting/csv-parser";
import { ensureAccountingSetup } from "@/lib/services/accounting-setup";
import { recordExpense, recordIncome } from "@/lib/services/accounting-transactions";
import { getSessionContext } from "@/lib/services/session-context";

export interface BankAccountInput {
  name: string;
  bank_name?: string;
  account_number?: string;
  currency?: string;
  opening_balance?: number;
}

export async function fetchBankAccounts() {
  await ensureAccountingSetup();
  const { supabase, tenantId } = await getSessionContext();
  if (!tenantId) throw new Error("Tenant no configurado");

  const { data, error } = await supabase
    .from("bank_accounts")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("name");

  if (error) throw error;
  return data;
}

export async function createBankAccount(input: BankAccountInput) {
  await ensureAccountingSetup();
  const { supabase, user, tenantId } = await getSessionContext();
  if (!tenantId) throw new Error("Tenant no configurado");

  const { data: bankAccount } = await supabase
    .from("chart_of_accounts")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("code", "1110")
    .single();

  const { data, error: createError } = await supabase
    .from("bank_accounts")
    .insert({
      tenant_id: tenantId,
      user_id: user.id,
      name: input.name,
      bank_name: input.bank_name ?? "",
      account_number: input.account_number ?? "",
      currency: input.currency ?? "cop",
      opening_balance: input.opening_balance ?? 0,
      chart_account_id: bankAccount?.id,
    })
    .select("*")
    .single();

  if (createError) throw createError;
  return data;
}

export async function fetchBankTransactions(bankAccountId: string) {
  const { supabase } = await getSessionContext();

  const { data, error } = await supabase
    .from("bank_transactions")
    .select("*, journal_entries(id, description, transaction_type)")
    .eq("bank_account_id", bankAccountId)
    .order("transaction_date", { ascending: false });

  if (error) throw error;
  return data;
}

export async function importBankCsv(bankAccountId: string, csvContent: string) {
  const { supabase } = await getSessionContext();
  const rows = parseBankCsv(csvContent);
  const batchId = randomUUID();

  if (rows.length === 0) {
    throw new Error("No se encontraron movimientos válidos en el archivo CSV");
  }

  const payload = rows.map((row) => ({
    bank_account_id: bankAccountId,
    transaction_date: row.date,
    description: row.description,
    amount: row.amount,
    balance_after: row.balance_after ?? null,
    external_id: row.external_id,
    import_batch_id: batchId,
  }));

  const { data, error } = await supabase
    .from("bank_transactions")
    .insert(payload)
    .select("id");

  if (error) throw error;
  return { imported: data.length, batchId };
}

export async function reconcileBankTransaction(
  bankTransactionId: string,
  options: {
    category_id: string;
    project_id?: string | null;
    contact_id?: string | null;
  },
) {
  const { supabase } = await getSessionContext();

  const { data: bankTx, error: fetchError } = await supabase
    .from("bank_transactions")
    .select("*")
    .eq("id", bankTransactionId)
    .single();

  if (fetchError) throw fetchError;
  if (bankTx.reconciled_journal_entry_id) {
    throw new Error("Este movimiento ya está conciliado");
  }

  const amount = Math.abs(Number(bankTx.amount));
  const input = {
    entry_date: bankTx.transaction_date,
    description: bankTx.description,
    amount,
    category_id: options.category_id,
    project_id: options.project_id,
    contact_id: options.contact_id,
    reference: `BANK-${bankTransactionId.slice(0, 8)}`,
  };

  const entryId =
    Number(bankTx.amount) >= 0
      ? await recordIncome(input)
      : await recordExpense(input);

  const { error: updateError } = await supabase
    .from("bank_transactions")
    .update({ reconciled_journal_entry_id: entryId })
    .eq("id", bankTransactionId);

  if (updateError) throw updateError;

  return entryId;
}

export async function fetchUnreconciledTransactions(bankAccountId?: string) {
  const { supabase, tenantId } = await getSessionContext();
  if (!tenantId) throw new Error("Tenant no configurado");

  let query = supabase
    .from("bank_transactions")
    .select("*, bank_accounts(name, bank_name)")
    .is("reconciled_journal_entry_id", null)
    .order("transaction_date", { ascending: false });

  if (bankAccountId) {
    query = query.eq("bank_account_id", bankAccountId);
  } else {
    const { data: accounts } = await supabase
      .from("bank_accounts")
      .select("id")
      .eq("tenant_id", tenantId);
    const ids = (accounts ?? []).map((a) => a.id);
    if (ids.length === 0) return [];
    query = query.in("bank_account_id", ids);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}
