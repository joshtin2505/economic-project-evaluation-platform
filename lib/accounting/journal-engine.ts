import { ACCOUNT_CODES, DEFAULT_VAT_RATE } from "./puc-template";

export interface JournalLineInput {
  accountId: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface AccountLookup {
  id: string;
  code: string;
}

export function validateBalancedEntry(lines: JournalLineInput[]): void {
  const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0);
  const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0);
  const diff = Math.abs(totalDebit - totalCredit);
  if (diff > 0.01) {
    throw new Error(
      `Asiento desbalanceado: débitos ${totalDebit.toFixed(2)} ≠ créditos ${totalCredit.toFixed(2)}`,
    );
  }
}

function findAccount(accounts: AccountLookup[], code: string): string {
  const account = accounts.find((a) => a.code === code);
  if (!account) {
    throw new Error(`Cuenta ${code} no encontrada en el plan de cuentas`);
  }
  return account.id;
}

export function buildIncomeEntry(
  accounts: AccountLookup[],
  amount: number,
  categoryAccountId: string,
  useBank = true,
): JournalLineInput[] {
  const cashAccountId = findAccount(
    accounts,
    useBank ? ACCOUNT_CODES.BANK : ACCOUNT_CODES.CASH,
  );
  const lines: JournalLineInput[] = [
    { accountId: cashAccountId, debit: amount, credit: 0, description: "Ingreso" },
    { accountId: categoryAccountId, debit: 0, credit: amount, description: "Ingreso" },
  ];
  validateBalancedEntry(lines);
  return lines;
}

export function buildExpenseEntry(
  accounts: AccountLookup[],
  amount: number,
  categoryAccountId: string,
  useBank = true,
): JournalLineInput[] {
  const cashAccountId = findAccount(
    accounts,
    useBank ? ACCOUNT_CODES.BANK : ACCOUNT_CODES.CASH,
  );
  const lines: JournalLineInput[] = [
    { accountId: categoryAccountId, debit: amount, credit: 0, description: "Gasto" },
    { accountId: cashAccountId, debit: 0, credit: amount, description: "Gasto" },
  ];
  validateBalancedEntry(lines);
  return lines;
}

export function buildSaleInvoiceEntry(
  accounts: AccountLookup[],
  subtotal: number,
  taxAmount: number,
): JournalLineInput[] {
  const receivablesId = findAccount(accounts, ACCOUNT_CODES.RECEIVABLES);
  const revenueId = findAccount(accounts, "4135");
  const vatPayableId = findAccount(accounts, ACCOUNT_CODES.VAT_PAYABLE);
  const total = subtotal + taxAmount;

  const lines: JournalLineInput[] = [
    { accountId: receivablesId, debit: total, credit: 0, description: "Factura venta" },
    { accountId: revenueId, debit: 0, credit: subtotal, description: "Ingreso por venta" },
  ];

  if (taxAmount > 0) {
    lines.push({
      accountId: vatPayableId,
      debit: 0,
      credit: taxAmount,
      description: "IVA generado",
    });
  }

  validateBalancedEntry(lines);
  return lines;
}

export function buildPurchaseInvoiceEntry(
  accounts: AccountLookup[],
  subtotal: number,
  taxAmount: number,
  expenseAccountId: string,
): JournalLineInput[] {
  const payablesId = findAccount(accounts, ACCOUNT_CODES.PAYABLES);
  const vatReceivableId = findAccount(accounts, ACCOUNT_CODES.VAT_RECEIVABLE);
  const total = subtotal + taxAmount;

  const lines: JournalLineInput[] = [
    { accountId: expenseAccountId, debit: subtotal, credit: 0, description: "Compra" },
    { accountId: payablesId, debit: 0, credit: total, description: "Cuenta por pagar" },
  ];

  if (taxAmount > 0) {
    lines[0] = { ...lines[0], debit: subtotal };
    lines.splice(1, 0, {
      accountId: vatReceivableId,
      debit: taxAmount,
      credit: 0,
      description: "IVA descontable",
    });
  }

  validateBalancedEntry(lines);
  return lines;
}

export function buildPaymentEntry(
  accounts: AccountLookup[],
  amount: number,
  isReceivable: boolean,
): JournalLineInput[] {
  const bankId = findAccount(accounts, ACCOUNT_CODES.BANK);
  const counterpartyId = findAccount(
    accounts,
    isReceivable ? ACCOUNT_CODES.RECEIVABLES : ACCOUNT_CODES.PAYABLES,
  );

  const lines: JournalLineInput[] = isReceivable
    ? [
        { accountId: bankId, debit: amount, credit: 0, description: "Cobro" },
        { accountId: counterpartyId, debit: 0, credit: amount, description: "Cobro" },
      ]
    : [
        { accountId: counterpartyId, debit: amount, credit: 0, description: "Pago" },
        { accountId: bankId, debit: 0, credit: amount, description: "Pago" },
      ];

  validateBalancedEntry(lines);
  return lines;
}

export function calculateInvoiceTotals(
  lines: { quantity: number; unit_price: number; tax_rate?: number }[],
) {
  let subtotal = 0;
  let taxAmount = 0;

  for (const line of lines) {
    const lineSubtotal = line.quantity * line.unit_price;
    const rate = line.tax_rate ?? DEFAULT_VAT_RATE;
    subtotal += lineSubtotal;
    taxAmount += lineSubtotal * rate;
  }

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round((subtotal + taxAmount) * 100) / 100,
  };
}
