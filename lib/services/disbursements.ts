"use server";

import { createClient as createSupabaseClient } from "@/lib/supabase/server";

export type DisbursementCategory =
  | "land"
  | "construction"
  | "equipment"
  | "working_capital"
  | "licenses"
  | "other";

export type DisbursementStatus = "pending" | "committed" | "disbursed" | "cancelled";

export interface InvestmentDisbursement {
  id: string;
  project_id: string;
  period: number;
  category: DisbursementCategory;
  description: string;
  planned_amount: number;
  actual_amount: number;
  execution_date: string | null;
  status: DisbursementStatus;
  account_code: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDisbursementInput {
  project_id: string;
  period: number;
  category: DisbursementCategory;
  description?: string;
  planned_amount: number;
  actual_amount?: number;
  execution_date?: string | null;
  status?: DisbursementStatus;
  account_code?: string;
}

export interface ExecutionProgressSummary {
  totalPlanned: number;
  totalActual: number;
  disbursedAmount: number;
  committedAmount: number;
  pendingAmount: number;
  progressPercent: number;
  varianceAmount: number;
  variancePercent: number;
}

export interface CategorySummary {
  category: DisbursementCategory;
  categoryLabel: string;
  plannedAmount: number;
  actualAmount: number;
  count: number;
}

export const CATEGORY_LABELS: Record<DisbursementCategory, string> = {
  land: "Terrenos e Inmuebles",
  construction: "Obras Civiles y Construcción",
  equipment: "Maquinaria y Equipos",
  working_capital: "Capital de Trabajo",
  licenses: "Licencias e Intangibles",
  other: "Otros Costos Pre-operativos",
};

/**
 * Obtiene todos los desembolsos de un proyecto ordenados por período cronológico
 */
export async function fetchDisbursementsByProject(
  projectId: string,
): Promise<InvestmentDisbursement[]> {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("investment_disbursements")
    .select("*")
    .eq("project_id", projectId)
    .order("period", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data || []) as InvestmentDisbursement[];
}

/**
 * Crea un nuevo desembolso y sincroniza opcionalmente el total con el proyecto
 */
export async function createDisbursement(
  input: CreateDisbursementInput,
): Promise<InvestmentDisbursement> {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("investment_disbursements")
    .insert({
      project_id: input.project_id,
      period: input.period,
      category: input.category,
      description: input.description ?? "",
      planned_amount: input.planned_amount,
      actual_amount: input.actual_amount ?? 0,
      execution_date: input.execution_date ?? null,
      status: input.status ?? "pending",
      account_code: input.account_code ?? "",
    })
    .select()
    .single();

  if (error) throw error;

  await syncProjectInitialInvestment(input.project_id);
  return data as InvestmentDisbursement;
}

/**
 * Actualiza un desembolso existente
 */
export async function updateDisbursement(
  id: string,
  input: Partial<CreateDisbursementInput>,
): Promise<InvestmentDisbursement> {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("investment_disbursements")
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  if (data?.project_id) {
    await syncProjectInitialInvestment(data.project_id);
  }

  return data as InvestmentDisbursement;
}

/**
 * Elimina un desembolso por ID
 */
export async function deleteDisbursement(id: string): Promise<boolean> {
  const supabase = await createSupabaseClient();

  // Obtener el project_id antes de eliminar para resincronizar
  const { data: current } = await supabase
    .from("investment_disbursements")
    .select("project_id")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("investment_disbursements")
    .delete()
    .eq("id", id);

  if (error) throw error;

  if (current?.project_id) {
    await syncProjectInitialInvestment(current.project_id);
  }

  return true;
}

/**
 * Calcula el total de inversión planificada sumando planned_amount
 */
export async function calculateTotalPlannedInvestment(
  projectId: string,
): Promise<number> {
  const disbursements = await fetchDisbursementsByProject(projectId);
  return disbursements.reduce((sum, d) => sum + Number(d.planned_amount || 0), 0);
}

/**
 * Calcula el total de inversión ejecutada sumando actual_amount
 */
export async function calculateTotalActualInvestment(
  projectId: string,
): Promise<number> {
  const disbursements = await fetchDisbursementsByProject(projectId);
  return disbursements
    .filter((d) => d.status === "disbursed" || Number(d.actual_amount) > 0)
    .reduce((sum, d) => sum + Number(d.actual_amount || 0), 0);
}

/**
 * Genera el resumen de avance presupuestal y ejecución del CAPEX
 */
export async function getExecutionProgress(
  projectId: string,
): Promise<ExecutionProgressSummary> {
  const disbursements = await fetchDisbursementsByProject(projectId);

  let totalPlanned = 0;
  let totalActual = 0;
  let disbursedAmount = 0;
  let committedAmount = 0;
  let pendingAmount = 0;

  for (const d of disbursements) {
    const planned = Number(d.planned_amount || 0);
    const actual = Number(d.actual_amount || 0);

    totalPlanned += planned;
    totalActual += actual;

    switch (d.status) {
      case "disbursed":
        disbursedAmount += actual > 0 ? actual : planned;
        break;
      case "committed":
        committedAmount += planned;
        break;
      case "pending":
        pendingAmount += planned;
        break;
    }
  }

  const progressPercent = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;
  const varianceAmount = totalActual - totalPlanned;
  const variancePercent = totalPlanned > 0 ? (varianceAmount / totalPlanned) * 100 : 0;

  return {
    totalPlanned,
    totalActual,
    disbursedAmount,
    committedAmount,
    pendingAmount,
    progressPercent: Math.round(progressPercent * 10) / 10,
    varianceAmount,
    variancePercent: Math.round(variancePercent * 10) / 10,
  };
}

/**
 * Agrupa los desembolsos por categoría con totales
 */
export async function getDisbursementsByCategory(
  projectId: string,
): Promise<CategorySummary[]> {
  const disbursements = await fetchDisbursementsByProject(projectId);
  const map = new Map<DisbursementCategory, { planned: number; actual: number; count: number }>();

  // Inicializar categorías
  (Object.keys(CATEGORY_LABELS) as DisbursementCategory[]).forEach((cat) => {
    map.set(cat, { planned: 0, actual: 0, count: 0 });
  });

  for (const d of disbursements) {
    const current = map.get(d.category) ?? { planned: 0, actual: 0, count: 0 };
    current.planned += Number(d.planned_amount || 0);
    current.actual += Number(d.actual_amount || 0);
    current.count += 1;
    map.set(d.category, current);
  }

  const result: CategorySummary[] = [];
  map.forEach((val, key) => {
    if (val.count > 0 || val.planned > 0) {
      result.push({
        category: key,
        categoryLabel: CATEGORY_LABELS[key] || key,
        plannedAmount: val.planned,
        actualAmount: val.actual,
        count: val.count,
      });
    }
  });

  return result.sort((a, b) => b.plannedAmount - a.plannedAmount);
}

/**
 * Mantiene projects.initial_investment sincronizado con el total de planned_amount
 */
export async function syncProjectInitialInvestment(
  projectId: string,
): Promise<void> {
  const supabase = await createSupabaseClient();
  const totalPlanned = await calculateTotalPlannedInvestment(projectId);

  if (totalPlanned > 0) {
    await supabase
      .from("projects")
      .update({
        initial_investment: totalPlanned,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);
  }
}
