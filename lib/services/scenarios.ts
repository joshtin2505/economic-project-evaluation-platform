"use server";

import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { fetchProjectById, fetchCashFlows } from "./projects";
import {
  calculateScenarioResults,
  generateScenarioFlows,
  calculateRiskMetrics,
  type ScenarioType,
  type ScenarioResultMetrics,
  type RiskAnalysisSummary,
} from "@/lib/engines/scenario-engine";
import type { FinancialCashFlow } from "@/lib/engines/financial-engine";

export interface ScenarioRecord {
  id: string;
  project_id: string;
  name: string;
  type: ScenarioType;
  description: string;
  probability: number;
  parameters: {
    discountRate?: number;
    inflowVariationPct?: number;
    outflowVariationPct?: number;
    investmentVariationPct?: number;
  };
  results: ScenarioResultMetrics | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectScenariosAnalysis {
  projectId: string;
  projectName: string;
  baseInvestment: number;
  baseDiscountRate: number;
  scenarios: ScenarioRecord[];
  riskSummary: RiskAnalysisSummary;
}

/**
 * Obtiene todos los escenarios de un proyecto
 */
export async function fetchScenariosByProject(
  projectId: string,
): Promise<ScenarioRecord[]> {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("scenarios")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data || []) as ScenarioRecord[];
}

/**
 * Inicializa los escenarios predeterminados (Base, Optimista, Pesimista) si no existen
 */
export async function ensureDefaultScenarios(projectId: string): Promise<void> {
  const existing = await fetchScenariosByProject(projectId);
  if (existing.length > 0) return;

  const project = await fetchProjectById(projectId);
  if (!project) return;

  const baseRate = Number(project.discount_rate || 12);

  const defaultScenarios = [
    {
      project_id: projectId,
      name: "Escenario Esperado (Base)",
      type: "base" as ScenarioType,
      description: "Parámetros y flujos originales planificados",
      probability: 50,
      parameters: {
        discountRate: baseRate,
        inflowVariationPct: 0,
        outflowVariationPct: 0,
        investmentVariationPct: 0,
      },
    },
    {
      project_id: projectId,
      name: "Escenario Optimista",
      type: "optimistic" as ScenarioType,
      description: "Crecimiento de ingresos del 15% y ahorro en costos del 5%",
      probability: 25,
      parameters: {
        discountRate: baseRate,
        inflowVariationPct: 15,
        outflowVariationPct: -5,
        investmentVariationPct: 0,
      },
    },
    {
      project_id: projectId,
      name: "Escenario Pesimista",
      type: "pessimistic" as ScenarioType,
      description: "Caída de ingresos del 20% y sobrecosto de inversión del 10%",
      probability: 25,
      parameters: {
        discountRate: baseRate + 2,
        inflowVariationPct: -20,
        outflowVariationPct: 10,
        investmentVariationPct: 10,
      },
    },
  ];

  const supabase = await createSupabaseClient();
  await supabase.from("scenarios").insert(defaultScenarios);
}

/**
 * Crea un nuevo escenario y calcula automáticamente sus resultados
 */
export async function createScenario(input: {
  project_id: string;
  name: string;
  type?: ScenarioType;
  description?: string;
  probability: number;
  parameters: {
    discountRate?: number;
    inflowVariationPct?: number;
    outflowVariationPct?: number;
    investmentVariationPct?: number;
  };
}): Promise<ScenarioRecord> {
  const supabase = await createSupabaseClient();
  const project = await fetchProjectById(input.project_id);
  const rawFlows = await fetchCashFlows(input.project_id);

  const baseFlows: FinancialCashFlow[] = (rawFlows || []).map((f: any) => ({
    period: Number(f.period),
    inflow: Number(f.inflow || 0),
    outflow: Number(f.outflow || 0),
  }));

  const initialInv = Number(project?.initial_investment || 0);
  const discountRate = input.parameters.discountRate || Number(project?.discount_rate || 12);

  const adjustedFlows = generateScenarioFlows(
    baseFlows,
    input.parameters.inflowVariationPct || 0,
    input.parameters.outflowVariationPct || 0,
  );

  const results = calculateScenarioResults(
    initialInv,
    adjustedFlows,
    discountRate,
    input.parameters.investmentVariationPct || 0,
  );

  const { data, error } = await supabase
    .from("scenarios")
    .insert({
      project_id: input.project_id,
      name: input.name,
      type: input.type || "custom",
      description: input.description || "",
      probability: input.probability,
      parameters: input.parameters,
      results,
    })
    .select()
    .single();

  if (error) throw error;
  return data as ScenarioRecord;
}

/**
 * Actualiza un escenario existente y recalcula sus indicadores
 */
export async function updateScenario(
  id: string,
  input: Partial<ScenarioRecord>,
): Promise<ScenarioRecord> {
  const supabase = await createSupabaseClient();

  const { data: current, error: getErr } = await supabase
    .from("scenarios")
    .select("*")
    .eq("id", id)
    .single();

  if (getErr || !current) throw new Error("Escenario no encontrado");

  const project = await fetchProjectById(current.project_id);
  const rawFlows = await fetchCashFlows(current.project_id);

  const baseFlows: FinancialCashFlow[] = (rawFlows || []).map((f: any) => ({
    period: Number(f.period),
    inflow: Number(f.inflow || 0),
    outflow: Number(f.outflow || 0),
  }));

  const mergedParams = {
    ...current.parameters,
    ...(input.parameters || {}),
  };

  const initialInv = Number(project?.initial_investment || 0);
  const discountRate = mergedParams.discountRate || Number(project?.discount_rate || 12);

  const adjustedFlows = generateScenarioFlows(
    baseFlows,
    mergedParams.inflowVariationPct || 0,
    mergedParams.outflowVariationPct || 0,
  );

  const results = calculateScenarioResults(
    initialInv,
    adjustedFlows,
    discountRate,
    mergedParams.investmentVariationPct || 0,
  );

  const { data, error } = await supabase
    .from("scenarios")
    .update({
      ...input,
      parameters: mergedParams,
      results,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as ScenarioRecord;
}

/**
 * Elimina un escenario
 */
export async function deleteScenario(id: string): Promise<boolean> {
  const supabase = await createSupabaseClient();
  const { error } = await supabase.from("scenarios").delete().eq("id", id);
  if (error) throw error;
  return true;
}

/**
 * Analiza todos los escenarios de un proyecto y genera el balance de riesgo probabilístico
 */
export async function analyzeProjectScenarios(
  projectId: string,
): Promise<ProjectScenariosAnalysis> {
  await ensureDefaultScenarios(projectId);

  const project = await fetchProjectById(projectId);
  if (!project) throw new Error("Proyecto no encontrado");

  const rawFlows = await fetchCashFlows(projectId);
  const baseFlows: FinancialCashFlow[] = (rawFlows || []).map((f: any) => ({
    period: Number(f.period),
    inflow: Number(f.inflow || 0),
    outflow: Number(f.outflow || 0),
  }));

  const initialInv = Number(project.initial_investment || 0);
  const baseRate = Number(project.discount_rate || 12);

  const existingScenarios = await fetchScenariosByProject(projectId);
  const supabase = await createSupabaseClient();

  // Asegurar que los resultados estén calculados al día
  const scenarios: ScenarioRecord[] = [];
  for (const s of existingScenarios) {
    const rate = s.parameters?.discountRate || baseRate;
    const adjustedFlows = generateScenarioFlows(
      baseFlows,
      s.parameters?.inflowVariationPct || 0,
      s.parameters?.outflowVariationPct || 0,
    );

    const results = calculateScenarioResults(
      initialInv,
      adjustedFlows,
      rate,
      s.parameters?.investmentVariationPct || 0,
    );

    // Actualizar en memoria y en base si cambiaron
    scenarios.push({
      ...s,
      results,
    });

    void supabase
      .from("scenarios")
      .update({ results, updated_at: new Date().toISOString() })
      .eq("id", s.id);
  }

  // Calcular métricas de riesgo globales
  const scenarioPoints = scenarios
    .filter((s) => s.results !== null)
    .map((s) => ({
      probability: Number(s.probability || 0),
      npv: s.results!.npv,
    }));

  const riskSummary = calculateRiskMetrics(scenarioPoints);

  return {
    projectId,
    projectName: project.name,
    baseInvestment: initialInv,
    baseDiscountRate: baseRate,
    scenarios,
    riskSummary,
  };
}
