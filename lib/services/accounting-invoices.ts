"use server";

import {
  buildPaymentEntry,
  buildPurchaseInvoiceEntry,
  buildSaleInvoiceEntry,
  calculateInvoiceTotals,
} from "@/lib/accounting/journal-engine";
import { ensureAccountingSetup } from "@/lib/services/accounting-setup";
import { syncProjectCashFlowsFromAccounting } from "@/lib/services/accounting-project-bridge";
import { getSessionContext } from "@/lib/services/session-context";

export interface InvoiceLineInput {
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate?: number;
}

export interface InvoiceInput {
  invoice_type: "sale" | "purchase";
  contact_id?: string | null;
  issue_date: string;
  due_date?: string | null;
  notes?: string;
  project_id?: string | null;
  lines: InvoiceLineInput[];
}

async function getAccountLookup(tenantId: string) {
  const { supabase } = await getSessionContext();
  const { data, error } = await supabase
    .from("chart_of_accounts")
    .select("id, code")
    .eq("tenant_id", tenantId);

  if (error) throw error;
  return data;
}

async function getDefaultExpenseAccountId(tenantId: string) {
  const { supabase } = await getSessionContext();
  const { data, error } = await supabase
    .from("transaction_categories")
    .select("account_id")
    .eq("tenant_id", tenantId)
    .eq("category_type", "expense")
    .eq("is_default", true)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    const { data: fallback } = await supabase
      .from("transaction_categories")
      .select("account_id")
      .eq("tenant_id", tenantId)
      .eq("category_type", "expense")
      .limit(1)
      .maybeSingle();
    return fallback?.account_id;
  }
  return data.account_id;
}

export async function fetchInvoices(type?: "sale" | "purchase") {
  const { supabase, tenantId } = await getSessionContext();
  if (!tenantId) throw new Error("Tenant no configurado");

  let query = supabase
    .from("invoices")
    .select("*, contacts(name, tax_id)")
    .eq("tenant_id", tenantId)
    .order("issue_date", { ascending: false });

  if (type) query = query.eq("invoice_type", type);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchInvoiceById(id: string) {
  const { supabase, tenantId } = await getSessionContext();
  if (!tenantId) throw new Error("Tenant no configurado");

  const { data, error } = await supabase
    .from("invoices")
    .select("*, contacts(name, tax_id), invoice_lines(*)")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (error) throw error;
  return data;
}

export async function createInvoice(input: InvoiceInput) {
  await ensureAccountingSetup();
  const { supabase, user, tenantId } = await getSessionContext();
  if (!tenantId) throw new Error("Tenant no configurado");

  const totals = calculateInvoiceTotals(input.lines);

  const { data: invoice, error: invError } = await supabase
    .from("invoices")
    .insert({
      tenant_id: tenantId,
      user_id: user.id,
      contact_id: input.contact_id,
      invoice_type: input.invoice_type,
      status: "draft",
      issue_date: input.issue_date,
      due_date: input.due_date,
      subtotal: totals.subtotal,
      tax_amount: totals.taxAmount,
      total: totals.total,
      notes: input.notes ?? "",
      project_id: input.project_id,
      dian_status: "not_applicable",
    })
    .select("id")
    .single();

  if (invError) throw invError;

  const linesPayload = input.lines.map((line) => {
    const lineSubtotal = line.quantity * line.unit_price;
    const rate = line.tax_rate ?? 0.19;
    return {
      invoice_id: invoice.id,
      description: line.description,
      quantity: line.quantity,
      unit_price: line.unit_price,
      tax_rate: rate,
      line_total: Math.round(lineSubtotal * (1 + rate) * 100) / 100,
    };
  });

  const { error: linesError } = await supabase
    .from("invoice_lines")
    .insert(linesPayload);

  if (linesError) throw linesError;

  return invoice.id;
}

export async function issueInvoice(invoiceId: string) {
  await ensureAccountingSetup();
  const { supabase, user, tenantId } = await getSessionContext();
  if (!tenantId) throw new Error("Tenant no configurado");

  const invoice = await fetchInvoiceById(invoiceId);
  if (invoice.status !== "draft") {
    throw new Error("Solo se pueden emitir facturas en borrador");
  }

  const accounts = await getAccountLookup(tenantId);
  const lines =
    invoice.invoice_type === "sale"
      ? buildSaleInvoiceEntry(
          accounts,
          Number(invoice.subtotal),
          Number(invoice.tax_amount),
        )
      : buildPurchaseInvoiceEntry(
          accounts,
          Number(invoice.subtotal),
          Number(invoice.tax_amount),
          (await getDefaultExpenseAccountId(tenantId))!,
        );

  const { data: entry, error: entryError } = await supabase
    .from("journal_entries")
    .insert({
      tenant_id: tenantId,
      user_id: user.id,
      entry_date: invoice.issue_date,
      description: `Factura ${invoice.invoice_type === "sale" ? "venta" : "compra"} #${invoiceId.slice(0, 8)}`,
      transaction_type:
        invoice.invoice_type === "sale" ? "invoice_sale" : "invoice_purchase",
      amount: Number(invoice.total),
      project_id: invoice.project_id,
      contact_id: invoice.contact_id,
      status: "posted",
    })
    .select("id")
    .single();

  if (entryError) throw entryError;

  const linesPayload = lines.map((l) => ({
    journal_entry_id: entry.id,
    account_id: l.accountId,
    debit: l.debit,
    credit: l.credit,
    description: l.description ?? "",
  }));

  const { error: linesError } = await supabase
    .from("journal_entry_lines")
    .insert(linesPayload);

  if (linesError) throw linesError;

  const { error: updateError } = await supabase
    .from("invoices")
    .update({
      status: "issued",
      journal_entry_id: entry.id,
      invoice_number: `INV-${Date.now().toString(36).toUpperCase()}`,
    })
    .eq("id", invoiceId);

  if (updateError) throw updateError;

  if (invoice.project_id) {
    await syncProjectCashFlowsFromAccounting(invoice.project_id);
  }

  return entry.id;
}

export async function markInvoicePaid(invoiceId: string) {
  await ensureAccountingSetup();
  const { supabase, user, tenantId } = await getSessionContext();
  if (!tenantId) throw new Error("Tenant no configurado");

  const invoice = await fetchInvoiceById(invoiceId);
  if (invoice.status !== "issued") {
    throw new Error("Solo se pueden pagar facturas emitidas");
  }

  const accounts = await getAccountLookup(tenantId);
  const isReceivable = invoice.invoice_type === "sale";
  const paymentLines = buildPaymentEntry(
    accounts,
    Number(invoice.total),
    isReceivable,
  );

  const { data: paymentEntry, error: entryError } = await supabase
    .from("journal_entries")
    .insert({
      tenant_id: tenantId,
      user_id: user.id,
      entry_date: new Date().toISOString().slice(0, 10),
      description: `Pago factura ${invoice.invoice_number}`,
      transaction_type: "payment",
      amount: Number(invoice.total),
      contact_id: invoice.contact_id,
      project_id: invoice.project_id,
      status: "posted",
    })
    .select("id")
    .single();

  if (entryError) throw entryError;

  const { error: linesError } = await supabase
    .from("journal_entry_lines")
    .insert(
      paymentLines.map((l) => ({
        journal_entry_id: paymentEntry.id,
        account_id: l.accountId,
        debit: l.debit,
        credit: l.credit,
        description: l.description ?? "",
      })),
    );

  if (linesError) throw linesError;

  const { error: updateError } = await supabase
    .from("invoices")
    .update({
      status: "paid",
      payment_journal_entry_id: paymentEntry.id,
    })
    .eq("id", invoiceId);

  if (updateError) throw updateError;

  if (invoice.project_id) {
    await syncProjectCashFlowsFromAccounting(invoice.project_id);
  }

  return paymentEntry.id;
}
