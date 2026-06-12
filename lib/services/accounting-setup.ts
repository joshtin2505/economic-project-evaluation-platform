"use server";

import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_PUC_ACCOUNTS,
} from "@/lib/accounting/puc-template";
import { getSessionContext } from "@/lib/services/session-context";

export interface TenantCompanySettings {
  nit?: string;
  legal_name?: string;
  tax_regime?: "simplificado" | "comun";
  currency?: string;
}

export async function ensureAccountingSetup() {
  const { supabase, tenantId } = await getSessionContext();
  if (!tenantId) {
    throw new Error("No se encontró un tenant asociado a tu cuenta.");
  }

  const { count } = await supabase
    .from("chart_of_accounts")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  if ((count ?? 0) > 0) {
    return { initialized: true, alreadyExists: true };
  }

  const accountsPayload = DEFAULT_PUC_ACCOUNTS.map((a) => ({
    tenant_id: tenantId,
    code: a.code,
    name: a.name,
    account_type: a.account_type,
    parent_code: a.parent_code ?? null,
    is_active: true,
  }));

  const { data: accounts, error: accountsError } = await supabase
    .from("chart_of_accounts")
    .insert(accountsPayload)
    .select("id, code");

  if (accountsError) throw accountsError;

  const accountByCode = new Map(accounts.map((a) => [a.code, a.id]));

  const categoryPayload = [
    ...DEFAULT_INCOME_CATEGORIES.map((c) => ({
      tenant_id: tenantId,
      name: c.name,
      category_type: "income" as const,
      account_id: accountByCode.get(c.account_code)!,
      is_default: c.name === "Ventas de productos",
    })),
    ...DEFAULT_EXPENSE_CATEGORIES.map((c) => ({
      tenant_id: tenantId,
      name: c.name,
      category_type: "expense" as const,
      account_id: accountByCode.get(c.account_code)!,
      is_default: c.name === "Otros gastos",
    })),
  ];

  const { error: catError } = await supabase
    .from("transaction_categories")
    .insert(categoryPayload);

  if (catError) throw catError;

  return { initialized: true, alreadyExists: false };
}

export async function fetchChartOfAccounts() {
  const { supabase, tenantId } = await getSessionContext();
  if (!tenantId) throw new Error("Tenant no configurado");

  await ensureAccountingSetup();

  const { data, error } = await supabase
    .from("chart_of_accounts")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .order("code");

  if (error) throw error;
  return data;
}

export async function fetchTransactionCategories(
  type?: "income" | "expense",
) {
  const { supabase, tenantId } = await getSessionContext();
  if (!tenantId) throw new Error("Tenant no configurado");

  await ensureAccountingSetup();

  let query = supabase
    .from("transaction_categories")
    .select("*, chart_of_accounts(code, name)")
    .eq("tenant_id", tenantId)
    .order("name");

  if (type) {
    query = query.eq("category_type", type);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchTenantCompanySettings(): Promise<TenantCompanySettings> {
  const { supabase, tenantId, company, currency } = await getSessionContext();
  if (!tenantId) return { legal_name: company, currency };

  const { data, error } = await supabase
    .from("tenants")
    .select("name, settings")
    .eq("id", tenantId)
    .single();

  if (error) throw error;

  const settings = (data.settings ?? {}) as TenantCompanySettings;
  return {
    nit: settings.nit ?? "",
    legal_name: settings.legal_name ?? data.name ?? company,
    tax_regime: settings.tax_regime ?? "simplificado",
    currency: settings.currency ?? currency ?? "cop",
  };
}

export async function updateTenantCompanySettings(
  settings: TenantCompanySettings,
) {
  const { supabase, tenantId } = await getSessionContext();
  if (!tenantId) throw new Error("Tenant no configurado");

  const { data: current, error: fetchError } = await supabase
    .from("tenants")
    .select("settings")
    .eq("id", tenantId)
    .single();

  if (fetchError) throw fetchError;

  const merged = { ...(current.settings ?? {}), ...settings };

  const { error } = await supabase
    .from("tenants")
    .update({
      settings: merged,
      name: settings.legal_name ?? undefined,
    })
    .eq("id", tenantId);

  if (error) throw error;
  return merged as TenantCompanySettings;
}
