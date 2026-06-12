"use server";

import { ACCOUNT_CODES } from "@/lib/accounting/puc-template";
import { ensureAccountingSetup } from "@/lib/services/accounting-setup";
import { getSessionContext } from "@/lib/services/session-context";

export interface AccountBalance {
  code: string;
  name: string;
  account_type: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface IncomeStatementLine {
  code: string;
  name: string;
  amount: number;
}

export interface FinancialReports {
  incomeStatement: {
    income: IncomeStatementLine[];
    expenses: IncomeStatementLine[];
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
  };
  balanceSheet: {
    assets: AccountBalance[];
    liabilities: AccountBalance[];
    equity: AccountBalance[];
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
  };
  cashFlow: {
    operatingInflows: number;
    operatingOutflows: number;
    netOperating: number;
    byMonth: { month: string; inflow: number; outflow: number; net: number }[];
  };
  vatSummary: {
    vatGenerated: number;
    vatDeductible: number;
    netVat: number;
    periodLabel: string;
  };
}

async function fetchAccountBalances(
  from?: string,
  to?: string,
): Promise<AccountBalance[]> {
  const { supabase, tenantId } = await getSessionContext();
  if (!tenantId) throw new Error("Tenant no configurado");

  const { data: accounts, error: accError } = await supabase
    .from("chart_of_accounts")
    .select("id, code, name, account_type")
    .eq("tenant_id", tenantId)
    .eq("is_active", true);

  if (accError) throw accError;

  let linesQuery = supabase
    .from("journal_entry_lines")
    .select(
      "debit, credit, account_id, journal_entries!inner(entry_date, status, tenant_id)",
    )
    .eq("journal_entries.tenant_id", tenantId)
    .eq("journal_entries.status", "posted");

  if (from) linesQuery = linesQuery.gte("journal_entries.entry_date", from);
  if (to) linesQuery = linesQuery.lte("journal_entries.entry_date", to);

  const { data: lines, error: linesError } = await linesQuery;
  if (linesError) throw linesError;

  const balanceMap = new Map<string, { debit: number; credit: number }>();

  for (const line of lines ?? []) {
    const current = balanceMap.get(line.account_id) ?? { debit: 0, credit: 0 };
    current.debit += Number(line.debit);
    current.credit += Number(line.credit);
    balanceMap.set(line.account_id, current);
  }

  return (accounts ?? []).map((account) => {
    const totals = balanceMap.get(account.id) ?? { debit: 0, credit: 0 };
    const isDebitNormal = ["asset", "expense"].includes(account.account_type);
    const balance = isDebitNormal
      ? totals.debit - totals.credit
      : totals.credit - totals.debit;

    return {
      code: account.code,
      name: account.name,
      account_type: account.account_type,
      debit: totals.debit,
      credit: totals.credit,
      balance,
    };
  });
}

export async function generateFinancialReports(
  from?: string,
  to?: string,
): Promise<FinancialReports> {
  await ensureAccountingSetup();

  const now = new Date();
  const defaultFrom =
    from ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const defaultTo = to ?? now.toISOString().slice(0, 10);

  const balances = await fetchAccountBalances(defaultFrom, defaultTo);

  const income = balances
    .filter((b) => b.account_type === "income" && b.balance !== 0)
    .map((b) => ({ code: b.code, name: b.name, amount: b.balance }));

  const expenses = balances
    .filter((b) => b.account_type === "expense" && b.balance !== 0)
    .map((b) => ({ code: b.code, name: b.name, amount: b.balance }));

  const totalIncome = income.reduce((s, i) => s + i.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const assets = balances.filter(
    (b) => b.account_type === "asset" && b.balance !== 0,
  );
  const liabilities = balances.filter(
    (b) => b.account_type === "liability" && b.balance !== 0,
  );
  const equity = balances.filter(
    (b) => b.account_type === "equity" && b.balance !== 0,
  );

  const { supabase, tenantId } = await getSessionContext();
  const { data: entries } = await supabase
    .from("journal_entries")
    .select("entry_date, transaction_type, amount")
    .eq("tenant_id", tenantId!)
    .eq("status", "posted")
    .gte("entry_date", defaultFrom)
    .lte("entry_date", defaultTo);

  let operatingInflows = 0;
  let operatingOutflows = 0;
  const monthMap = new Map<string, { inflow: number; outflow: number }>();

  for (const e of entries ?? []) {
    const month = e.entry_date.slice(0, 7);
    const current = monthMap.get(month) ?? { inflow: 0, outflow: 0 };
    const amount = Number(e.amount);

    if (["income", "invoice_sale"].includes(e.transaction_type)) {
      operatingInflows += amount;
      current.inflow += amount;
    } else if (["expense", "invoice_purchase"].includes(e.transaction_type)) {
      operatingOutflows += amount;
      current.outflow += amount;
    }

    monthMap.set(month, current);
  }

  const byMonth = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      inflow: data.inflow,
      outflow: data.outflow,
      net: data.inflow - data.outflow,
    }));

  const vatGenerated =
    balances.find((b) => b.code === ACCOUNT_CODES.VAT_PAYABLE)?.balance ?? 0;
  const vatDeductible =
    balances.find((b) => b.code === ACCOUNT_CODES.VAT_RECEIVABLE)?.balance ?? 0;

  return {
    incomeStatement: {
      income,
      expenses,
      totalIncome,
      totalExpenses,
      netIncome: totalIncome - totalExpenses,
    },
    balanceSheet: {
      assets,
      liabilities,
      equity,
      totalAssets: assets.reduce((s, a) => s + a.balance, 0),
      totalLiabilities: liabilities.reduce((s, l) => s + l.balance, 0),
      totalEquity: equity.reduce((s, e) => s + e.balance, 0),
    },
    cashFlow: {
      operatingInflows,
      operatingOutflows,
      netOperating: operatingInflows - operatingOutflows,
      byMonth,
    },
    vatSummary: {
      vatGenerated,
      vatDeductible,
      netVat: vatGenerated - vatDeductible,
      periodLabel: `${defaultFrom} — ${defaultTo}`,
    },
  };
}

export async function exportReportsToCsv(
  from?: string,
  to?: string,
): Promise<string> {
  const reports = await generateFinancialReports(from, to);

  const lines: string[] = [
    "ESTADO DE RESULTADOS",
    "Cuenta,Monto",
    ...reports.incomeStatement.income.map(
      (i) => `${i.code} - ${i.name},${i.amount}`,
    ),
    `Total Ingresos,${reports.incomeStatement.totalIncome}`,
    ...reports.incomeStatement.expenses.map(
      (e) => `${e.code} - ${e.name},${e.amount}`,
    ),
    `Total Gastos,${reports.incomeStatement.totalExpenses}`,
    `Utilidad Neta,${reports.incomeStatement.netIncome}`,
    "",
    "BALANCE GENERAL",
    "Tipo,Cuenta,Saldo",
    ...reports.balanceSheet.assets.map(
      (a) => `Activo,${a.code} - ${a.name},${a.balance}`,
    ),
    ...reports.balanceSheet.liabilities.map(
      (l) => `Pasivo,${l.code} - ${l.name},${l.balance}`,
    ),
    ...reports.balanceSheet.equity.map(
      (e) => `Patrimonio,${e.code} - ${e.name},${e.balance}`,
    ),
    "",
    "FLUJO DE CAJA OPERATIVO",
    `Entradas,${reports.cashFlow.operatingInflows}`,
    `Salidas,${reports.cashFlow.operatingOutflows}`,
    `Neto,${reports.cashFlow.netOperating}`,
    "",
    "RESUMEN IVA",
    `IVA generado,${reports.vatSummary.vatGenerated}`,
    `IVA descontable,${reports.vatSummary.vatDeductible}`,
    `IVA neto,${reports.vatSummary.netVat}`,
  ];

  return lines.join("\n");
}
