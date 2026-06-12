"use server";

import { createClient as createSupabaseClient } from "@/lib/supabase/server";

export async function getSessionContext() {
  const supabase = await createSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Session expired. Please log in again.");
  }

  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("tenant_id, accounting_method, currency, tax_jurisdiction, company")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;

  return {
    supabase,
    user,
    tenantId: profile?.tenant_id ?? null,
    accountingMethod: profile?.accounting_method ?? "cash",
    currency: profile?.currency ?? "cop",
    taxJurisdiction: profile?.tax_jurisdiction ?? "",
    company: profile?.company ?? "",
  };
}
