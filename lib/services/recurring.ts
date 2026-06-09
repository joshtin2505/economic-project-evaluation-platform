"use server";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";

export type RecurringKind = "income" | "expense";

export interface IncomeSource {
  id: string;
  tenant_id?: string | null;
  user_id: string;
  name: string;
  amount: number;
  frequency: "daily" | "weekly" | "monthly" | "quarterly" | "annual";
  start_date: string;
  end_date?: string | null;
  notes?: string | null;
}

export interface RecurringExpense {
  id: string;
  tenant_id?: string | null;
  user_id: string;
  name: string;
  amount: number;
  category?: string | null;
  frequency: "daily" | "weekly" | "monthly" | "quarterly" | "annual";
  start_date: string;
  end_date?: string | null;
  notes?: string | null;
}

async function getSessionContext() {
  const supabase = await createSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Session expired. Please log in again.");
  }

  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;

  return {
    supabase,
    user,
    tenantId: profile?.tenant_id ?? null,
  };
}

export async function fetchIncomeSources() {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("income_sources")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as IncomeSource[];
}

export async function fetchIncomeSourceById(id: string) {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("income_sources")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as IncomeSource;
}

export async function createIncomeSource(
  payload: Omit<Partial<IncomeSource>, "user_id" | "tenant_id">,
) {
  const { supabase, user, tenantId } = await getSessionContext();
  const { data, error } = await supabase
    .from("income_sources")
    .insert({
      ...payload,
      user_id: user.id,
      tenant_id: tenantId,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as IncomeSource;
}

export async function updateIncomeSource(
  id: string,
  payload: Omit<Partial<IncomeSource>, "user_id" | "tenant_id">,
) {
  const supabase = await createSupabaseClient();
  const { error } = await supabase
    .from("income_sources")
    .update(payload)
    .eq("id", id);
  if (error) throw error;
  return true;
}

export async function deleteIncomeSource(id: string) {
  const supabase = await createSupabaseClient();
  const { error } = await supabase.from("income_sources").delete().eq("id", id);
  if (error) throw error;
  return true;
}

export async function fetchRecurringExpenses() {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("recurring_expenses")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as RecurringExpense[];
}

export async function fetchRecurringExpenseById(id: string) {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("recurring_expenses")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as RecurringExpense;
}

export async function createRecurringExpense(
  payload: Omit<Partial<RecurringExpense>, "user_id" | "tenant_id">,
) {
  const { supabase, user, tenantId } = await getSessionContext();
  const { data, error } = await supabase
    .from("recurring_expenses")
    .insert({
      ...payload,
      user_id: user.id,
      tenant_id: tenantId,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as RecurringExpense;
}

export async function updateRecurringExpense(
  id: string,
  payload: Omit<Partial<RecurringExpense>, "user_id" | "tenant_id">,
) {
  const supabase = await createSupabaseClient();
  const { error } = await supabase
    .from("recurring_expenses")
    .update(payload)
    .eq("id", id);
  if (error) throw error;
  return true;
}

export async function deleteRecurringExpense(id: string) {
  const supabase = await createSupabaseClient();
  const { error } = await supabase
    .from("recurring_expenses")
    .delete()
    .eq("id", id);
  if (error) throw error;
  return true;
}
