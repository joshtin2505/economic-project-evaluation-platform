/**
 * Motor de Escenarios de Evaluación Económica (Pure Scenario Engine)
 * Modela escenarios probabilísticos (Optimista, Esperado, Pesimista, Personalizado)
 * y calcula métricas de riesgo financiero (VPN esperado, Desviación Estándar, Coeficiente de Variación).
 */

import {
  calculateNPV,
  calculateIRR,
  calculateBenefitCostRatio,
  calculatePaybackPeriod,
  calculateProfitabilityIndex,
  type FinancialCashFlow,
} from "./financial-engine";

export type ScenarioType = "base" | "optimistic" | "pessimistic" | "expected" | "custom";

export interface ScenarioDefinition {
  id?: string;
  projectId: string;
  name: string;
  type: ScenarioType;
  description?: string;
  probability: number; // 0 a 100
  parameters?: {
    discountRate?: number; // e.g. 12 para 12%
    inflowVariationPct?: number; // e.g. +10% o -15%
    outflowVariationPct?: number; // e.g. +5% o -5%
    investmentVariationPct?: number; // e.g. +10%
  };
}

export interface ScenarioResultMetrics {
  npv: number;
  irr: number | null;
  benefitCostRatio: number;
  paybackPeriod: number | null;
  profitabilityIndex: number;
  isViable: boolean;
}

export interface RiskAnalysisSummary {
  expectedNpv: number;
  variance: number;
  standardDeviation: number;
  coefficientOfVariation: number; // CV = sigma / mu (menor CV = menor riesgo relativo)
  riskLevel: "Bajo" | "Moderado" | "Alto";
}

/**
 * Genera una serie de flujos proyectados aplicando variaciones porcentuales a ingresos y egresos
 */
export function generateScenarioFlows(
  baseFlows: FinancialCashFlow[],
  inflowVariationPct = 0,
  outflowVariationPct = 0,
): FinancialCashFlow[] {
  const inflowMultiplier = 1 + inflowVariationPct / 100;
  const outflowMultiplier = 1 + outflowVariationPct / 100;

  return baseFlows.map((flow) => ({
    period: flow.period,
    inflow: Math.round(flow.inflow * inflowMultiplier * 100) / 100,
    outflow: Math.round(flow.outflow * outflowMultiplier * 100) / 100,
  }));
}

/**
 * Calcula todas las métricas financieras para un escenario específico
 */
export function calculateScenarioResults(
  baseInvestment: number,
  cashFlows: FinancialCashFlow[],
  discountRate: number,
  investmentVariationPct = 0,
): ScenarioResultMetrics {
  const effectiveInvestment = Math.max(0, baseInvestment * (1 + investmentVariationPct / 100));
  const effectiveRate = discountRate > 1 ? discountRate / 100 : discountRate;

  const npv = calculateNPV(effectiveInvestment, cashFlows, effectiveRate);
  const irr = calculateIRR(effectiveInvestment, cashFlows);
  const benefitCostRatio = calculateBenefitCostRatio(effectiveInvestment, cashFlows, effectiveRate);
  const paybackPeriod = calculatePaybackPeriod(effectiveInvestment, cashFlows, effectiveRate);
  const profitabilityIndex = calculateProfitabilityIndex(effectiveInvestment, cashFlows, effectiveRate);

  return {
    npv: Math.round(npv * 100) / 100,
    irr: irr !== null ? Math.round(irr * 10000) / 10000 : null,
    benefitCostRatio: Math.round(benefitCostRatio * 100) / 100,
    paybackPeriod: paybackPeriod !== null ? Math.round(paybackPeriod * 10) / 10 : null,
    profitabilityIndex: Math.round(profitabilityIndex * 100) / 100,
    isViable: npv >= 0,
  };
}

/**
 * Calcula el Valor Presente Neto Esperado:
 * E[VPN] = Suma( Probabilidad_i * VPN_i )
 */
export function buildExpectedValueNpv(
  scenarios: { probability: number; npv: number }[],
): number {
  const totalProb = scenarios.reduce((sum, s) => sum + s.probability, 0);
  if (totalProb === 0) return 0;

  // Normalizar probabilidades si no suman exactamente 100
  return scenarios.reduce((sum, s) => {
    const normalizedProb = s.probability / totalProb;
    return sum + normalizedProb * s.npv;
  }, 0);
}

/**
 * Calcula métricas de dispersión y riesgo (Varianza, Desviación Estándar y Coeficiente de Variación)
 */
export function calculateRiskMetrics(
  scenarios: { probability: number; npv: number }[],
): RiskAnalysisSummary {
  const totalProb = scenarios.reduce((sum, s) => sum + s.probability, 0);
  if (scenarios.length === 0 || totalProb === 0) {
    return {
      expectedNpv: 0,
      variance: 0,
      standardDeviation: 0,
      coefficientOfVariation: 0,
      riskLevel: "Bajo",
    };
  }

  const expectedNpv = buildExpectedValueNpv(scenarios);

  // Varianza: Var(VPN) = Suma( P_i * (VPN_i - E[VPN])^2 )
  const variance = scenarios.reduce((sum, s) => {
    const normalizedProb = s.probability / totalProb;
    const diff = s.npv - expectedNpv;
    return sum + normalizedProb * Math.pow(diff, 2);
  }, 0);

  const standardDeviation = Math.sqrt(variance);

  // Coeficiente de variación: CV = sigma / |mu|
  const coefficientOfVariation =
    expectedNpv !== 0 ? Math.abs(standardDeviation / expectedNpv) : 0;

  let riskLevel: "Bajo" | "Moderado" | "Alto" = "Bajo";
  if (coefficientOfVariation > 1.0) {
    riskLevel = "Alto";
  } else if (coefficientOfVariation > 0.4) {
    riskLevel = "Moderado";
  }

  return {
    expectedNpv: Math.round(expectedNpv),
    variance: Math.round(variance),
    standardDeviation: Math.round(standardDeviation),
    coefficientOfVariation: Math.round(coefficientOfVariation * 100) / 100,
    riskLevel,
  };
}
