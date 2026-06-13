"use server";

import { fetchProjectGroupById } from "./project-groups";
import { fetchCashFlows } from "./projects";
import {
  calculateNPV,
  calculateIRR,
  calculateBenefitCostRatio,
  calculatePaybackPeriod,
  calculateProfitabilityIndex,
  type FinancialCashFlow,
} from "@/lib/engines/financial-engine";

export interface AlternativeMetrics {
  projectId: string;
  projectName: string;
  initialInvestment: number;
  periods: number;
  ownDiscountRate: number;
  groupDiscountRate: number;
  // Métricas calculadas con la tasa común del grupo
  npv: number;
  irr: number | null;
  benefitCostRatio: number;
  paybackPeriod: number | null;
  profitabilityIndex: number;
  isViable: boolean;
}

export interface IncrementalStep {
  alternativeAId: string;
  alternativeAName: string;
  alternativeBId: string;
  alternativeBName: string;
  deltaInvestment: number;
  deltaNpv: number;
  deltaIrr: number | null;
  decision: "keep_A" | "switch_to_B";
  explanation: string;
}

export interface AlternativesAnalysisResult {
  groupId: string;
  groupName: string;
  comparisonRate: number;
  metrics: AlternativeMetrics[];
  ranking: { projectId: string; rank: number; score: number }[];
  incrementalSteps: IncrementalStep[];
  recommendedProjectId: string | null;
  recommendationExplanation: string;
}

/**
 * Realiza el análisis comparativo completo de las alternativas en un grupo
 */
export async function analyzeAlternativesInGroup(
  groupId: string
): Promise<AlternativesAnalysisResult> {
  const group = await fetchProjectGroupById(groupId);
  
  // Tasa común de comparación (si no existe, usamos 12% por defecto)
  const comparisonRate = group.comparison_rate !== null 
    ? Number(group.comparison_rate) / 100 
    : 0.12;

  // Obtener flujos para todos los miembros
  const metrics: AlternativeMetrics[] = [];

  for (const member of group.members) {
    if (!member.project) continue;
    const project = member.project;
    
    // Obtener flujos de caja de la base de datos
    const rawFlows = await fetchCashFlows(project.id);
    const cashFlows: FinancialCashFlow[] = rawFlows.map((f: any) => ({
      period: f.period,
      inflow: Number(f.inflow),
      outflow: Number(f.outflow),
    }));

    const initialInvestment = Number(project.initial_investment);
    const ownRate = (Number(project.discount_rate) || 0) / 100;

    // Calcular métricas usando la tasa de comparación del grupo
    const npv = calculateNPV(initialInvestment, cashFlows, comparisonRate);
    const irr = calculateIRR(initialInvestment, cashFlows);
    const benefitCostRatio = calculateBenefitCostRatio(initialInvestment, cashFlows, comparisonRate);
    const paybackPeriod = calculatePaybackPeriod(initialInvestment, cashFlows, comparisonRate);
    const profitabilityIndex = calculateProfitabilityIndex(initialInvestment, cashFlows, comparisonRate);
    
    metrics.push({
      projectId: project.id,
      projectName: project.name,
      initialInvestment,
      periods: project.periods,
      ownDiscountRate: ownRate,
      groupDiscountRate: comparisonRate,
      npv,
      irr,
      benefitCostRatio,
      paybackPeriod,
      profitabilityIndex,
      isViable: npv >= 0,
    });
  }

  if (metrics.length === 0) {
    return {
      groupId: group.id,
      groupName: group.name,
      comparisonRate,
      metrics: [],
      ranking: [],
      incrementalSteps: [],
      recommendedProjectId: null,
      recommendationExplanation: "No hay alternativas suficientes para realizar el análisis.",
    };
  }

  // 1. Generar ranking simple basado en el VPN
  const sortedByNpv = [...metrics].sort((a, b) => b.npv - a.npv);
  const ranking = sortedByNpv.map((m, idx) => ({
    projectId: m.projectId,
    rank: idx + 1,
    score: m.npv,
  }));

  // 2. Análisis Incremental (para alternativas mutuamente excluyentes)
  // Las ordenamos de menor a mayor inversión inicial
  const sortedByInvestment = [...metrics].sort((a, b) => a.initialInvestment - b.initialInvestment);
  
  const incrementalSteps: IncrementalStep[] = [];
  let champion = sortedByInvestment[0]; // Empezamos con la menor inversión como campeón

  for (let i = 1; i < sortedByInvestment.length; i++) {
    const challenger = sortedByInvestment[i];
    
    // Obtener los flujos alineados para la diferencia
    const pA = group.members.find((m: any) => m.project_id === champion.projectId)?.project;
    const pB = group.members.find((m: any) => m.project_id === challenger.projectId)?.project;
    
    if (!pA || !pB) continue;

    const flowsA = await fetchCashFlows(champion.projectId);
    const flowsB = await fetchCashFlows(challenger.projectId);

    const maxPeriods = Math.max(champion.periods, challenger.periods);
    const deltaInvestment = challenger.initialInvestment - champion.initialInvestment;
    
    // Construir flujos incrementales (B - A)
    const deltaFlows: FinancialCashFlow[] = [];
    for (let p = 1; p <= maxPeriods; p++) {
      const fA = flowsA.find((f: any) => f.period === p);
      const fB = flowsB.find((f: any) => f.period === p);
      
      const netA = fA ? Number(fA.inflow) - Number(fA.outflow) : 0;
      const netB = fB ? Number(fB.inflow) - Number(fB.outflow) : 0;
      
      deltaFlows.push({
        period: p,
        inflow: netB - netA >= 0 ? netB - netA : 0,
        outflow: netB - netA < 0 ? Math.abs(netB - netA) : 0,
      });
    }

    // Calcular VPN e TIR incremental
    const deltaNpv = calculateNPV(deltaInvestment, deltaFlows, comparisonRate);
    const deltaIrr = calculateIRR(deltaInvestment, deltaFlows);

    // Criterio de decisión: si la TIR incremental > tasa de comparación,
    // o si el VPN incremental es > 0, se justifica la inversión adicional.
    const isJustified = deltaNpv > 0 || (deltaIrr !== null && deltaIrr > comparisonRate);
    const decision = isJustified ? ("switch_to_B" as const) : ("keep_A" as const);
    
    const explanation = isJustified
      ? `El proyecto ${challenger.projectName} justifica su inversión adicional de $${deltaInvestment.toLocaleString()} frente a ${champion.projectName} porque produce un VPN incremental positivo de $${Math.round(deltaNpv).toLocaleString()} (TIR incremental de ${(deltaIrr ? (deltaIrr * 100).toFixed(2) : "N/A")}% frente a la tasa mínima de ${(comparisonRate * 100).toFixed(1)}%).`
      : `El proyecto ${challenger.projectName} NO justifica su inversión adicional de $${deltaInvestment.toLocaleString()} frente a ${champion.projectName} (VPN incremental de $${Math.round(deltaNpv).toLocaleString()} y TIR incremental de ${(deltaIrr ? (deltaIrr * 100).toFixed(2) : "N/A")}%). Se mantiene ${champion.projectName} como mejor opción.`;

    incrementalSteps.push({
      alternativeAId: champion.projectId,
      alternativeAName: champion.projectName,
      alternativeBId: challenger.projectId,
      alternativeBName: challenger.projectName,
      deltaInvestment,
      deltaNpv,
      deltaIrr,
      decision,
      explanation,
    });

    if (isJustified) {
      champion = challenger; // El retador se convierte en el nuevo campeón
    }
  }

  // La recomendación final es el último campeón que quede
  // Sin embargo, si el campeón final tiene VPN negativo (no es viable), no deberíamos recomendar invertir
  const recommendedProjectId = champion.npv >= 0 ? champion.projectId : null;
  
  let recommendationExplanation = "";
  if (recommendedProjectId) {
    if (metrics.length === 1) {
      recommendationExplanation = `Se recomienda el proyecto ${champion.projectName} ya que cuenta con un VPN positivo de $${Math.round(champion.npv).toLocaleString()} bajo una tasa del ${(comparisonRate * 100).toFixed(1)}%.`;
    } else {
      recommendationExplanation = `Tras realizar el análisis incremental paso a paso, la alternativa óptima recomendada es ${champion.projectName}. Este proyecto cuenta con un VPN de $${Math.round(champion.npv).toLocaleString()} y justifica financieramente su nivel de inversión frente a las demás alternativas disponibles.`;
    }
  } else {
    recommendationExplanation = `Ninguno de los proyectos analizados es financieramente viable bajo la tasa mínima de rendimiento del ${(comparisonRate * 100).toFixed(1)}% (todos presentan un VPN negativo). Se recomienda rechazar todas las alternativas.`;
  }

  return {
    groupId: group.id,
    groupName: group.name,
    comparisonRate,
    metrics,
    ranking,
    incrementalSteps,
    recommendedProjectId,
    recommendationExplanation,
  };
}
