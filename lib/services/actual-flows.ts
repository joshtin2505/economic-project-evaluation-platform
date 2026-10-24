"use server";

import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { calculateNPV, type FinancialCashFlow } from "@/lib/engines/financial-engine";
import { fetchProjectById } from "./projects";

export interface CashFlowComparisonItem {
  period: number;
  projectedInflow: number;
  actualInflow: number;
  projectedOutflow: number;
  actualOutflow: number;
  projectedNet: number;
  actualNet: number;
  varianceNet: number; // actualNet - projectedNet
  variancePercent: number; // % de desviación
  status: "favorable" | "desfavorable" | "neutro";
  hasActualData: boolean;
  notes?: string;
  accountCode?: string;
  recordedAt?: string;
}

export interface VarianceReportSummary {
  projectId: string;
  projectName: string;
  totalProjectedInflow: number;
  totalActualInflow: number;
  totalProjectedOutflow: number;
  totalActualOutflow: number;
  totalProjectedNet: number;
  totalActualNet: number;
  netVariance: number;
  items: CashFlowComparisonItem[];
  alerts: DeviationAlert[];
  projectedNpv: number;
  actualizedNpv: number;
}

export interface DeviationAlert {
  period: number;
  type: "warning" | "danger" | "success";
  title: string;
  message: string;
  deviationPercent: number;
}

/**
 * Registra o actualiza el flujo de caja real de un período
 */
export async function recordActualFlow(
  projectId: string,
  period: number,
  inflow: number,
  outflow: number,
  accountCode = "",
  notes = "",
) {
  const supabase = await createSupabaseClient();

  // Buscar si ya existe un registro 'actual' para este proyecto y período
  const { data: existing } = await supabase
    .from("cash_flows")
    .select("id")
    .eq("project_id", projectId)
    .eq("period", period)
    .eq("flow_type", "actual")
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("cash_flows")
      .update({
        inflow,
        outflow,
        account_code: accountCode,
        notes,
        recorded_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from("cash_flows")
    .insert({
      project_id: projectId,
      period,
      inflow,
      outflow,
      flow_type: "actual",
      source: "manual",
      account_code: accountCode,
      notes,
      recorded_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Obtiene el informe comparativo completo entre flujos proyectados y reales
 */
export async function getVarianceReport(
  projectId: string,
  deviationThresholdPct = 15,
): Promise<VarianceReportSummary> {
  const supabase = await createSupabaseClient();
  const project = await fetchProjectById(projectId);
  if (!project) throw new Error("Proyecto no encontrado");

  // Obtener todos los flujos de caja del proyecto
  const { data: rawFlows, error } = await supabase
    .from("cash_flows")
    .select("*")
    .eq("project_id", projectId)
    .order("period", { ascending: true });

  if (error) throw error;

  const projectedMap = new Map<number, any>();
  const actualMap = new Map<number, any>();

  (rawFlows || []).forEach((f) => {
    const p = Number(f.period);
    if (f.flow_type === "actual") {
      actualMap.set(p, f);
    } else {
      projectedMap.set(p, f);
    }
  });

  const allPeriods = Array.from(
    new Set([...projectedMap.keys(), ...actualMap.keys()]),
  ).sort((a, b) => a - b);

  let totalProjectedInflow = 0;
  let totalActualInflow = 0;
  let totalProjectedOutflow = 0;
  let totalActualOutflow = 0;

  const items: CashFlowComparisonItem[] = [];
  const alerts: DeviationAlert[] = [];

  // Arrays para recalcular VPN proyectado vs actual
  const projectedCashFlows: FinancialCashFlow[] = [];
  const actualizedCashFlows: FinancialCashFlow[] = [];

  for (const period of allPeriods) {
    const proj = projectedMap.get(period);
    const act = actualMap.get(period);

    const pInflow = proj ? Number(proj.inflow || 0) : 0;
    const pOutflow = proj ? Number(proj.outflow || 0) : 0;
    const pNet = pInflow - pOutflow;

    const hasActual = Boolean(act);
    const aInflow = act ? Number(act.inflow || 0) : 0;
    const aOutflow = act ? Number(act.outflow || 0) : 0;
    const aNet = hasActual ? aInflow - aOutflow : pNet; // si no hay actual, usamos proyectado para proyecciones futuras

    totalProjectedInflow += pInflow;
    totalProjectedOutflow += pOutflow;
    if (hasActual) {
      totalActualInflow += aInflow;
      totalActualOutflow += aOutflow;
    }

    const varianceNet = hasActual ? aNet - pNet : 0;
    const variancePercent =
      hasActual && Math.abs(pNet) > 0 ? (varianceNet / Math.abs(pNet)) * 100 : 0;

    let status: "favorable" | "desfavorable" | "neutro" = "neutro";
    if (hasActual) {
      if (varianceNet > 0) status = "favorable";
      else if (varianceNet < 0) status = "desfavorable";
    }

    items.push({
      period,
      projectedInflow: pInflow,
      actualInflow: aInflow,
      projectedOutflow: pOutflow,
      actualOutflow: aOutflow,
      projectedNet: pNet,
      actualNet: hasActual ? aNet : 0,
      varianceNet,
      variancePercent: Math.round(variancePercent * 10) / 10,
      status,
      hasActualData: hasActual,
      notes: act?.notes || "",
      accountCode: act?.account_code || "",
      recordedAt: act?.recorded_at || undefined,
    });

    projectedCashFlows.push({ period, inflow: pInflow, outflow: pOutflow });
    actualizedCashFlows.push({
      period,
      inflow: hasActual ? aInflow : pInflow,
      outflow: hasActual ? aOutflow : pOutflow,
    });

    // Generar alertas si supera el umbral
    if (hasActual && Math.abs(variancePercent) >= deviationThresholdPct) {
      if (varianceNet < 0) {
        alerts.push({
          period,
          type: "danger",
          title: `Desviación desfavorable en Período ${period}`,
          message: `El flujo neto real ($${aNet.toLocaleString()}) estuvo ${Math.abs(
            Math.round(variancePercent),
          )}% por debajo de lo proyectado ($${pNet.toLocaleString()}).`,
          deviationPercent: Math.round(variancePercent),
        });
      } else {
        alerts.push({
          period,
          type: "success",
          title: `Rendimiento superior en Período ${period}`,
          message: `El flujo neto real superó la meta en un ${Math.round(
            variancePercent,
          )}% (+$${varianceNet.toLocaleString()}).`,
          deviationPercent: Math.round(variancePercent),
        });
      }
    }
  }

  const initialInv = Number(project.initial_investment || 0);
  const discountRate = (Number(project.discount_rate) || 12) / 100;

  const projectedNpv = calculateNPV(initialInv, projectedCashFlows, discountRate);
  const actualizedNpv = calculateNPV(initialInv, actualizedCashFlows, discountRate);

  return {
    projectId,
    projectName: project.name,
    totalProjectedInflow,
    totalActualInflow,
    totalProjectedOutflow,
    totalActualOutflow,
    totalProjectedNet: totalProjectedInflow - totalProjectedOutflow,
    totalActualNet: totalActualInflow - totalActualOutflow,
    netVariance: totalActualInflow - totalActualOutflow - (totalProjectedInflow - totalProjectedOutflow),
    items,
    alerts,
    projectedNpv: Math.round(projectedNpv),
    actualizedNpv: Math.round(actualizedNpv),
  };
}
