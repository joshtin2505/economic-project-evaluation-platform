/**
 * Motor de Análisis de Sensibilidad (Pure Sensitivity Engine)
 * Modela gráficos Tornado (1D), Matrices Heatmap (2D) y Puntos de Equilibrio (Breakeven)
 * para variables críticas de proyectos de inversión.
 */

import { calculateNPV, calculateIRR, type FinancialCashFlow } from "./financial-engine";

export interface TornadoVariableResult {
  variableName: string;
  variableLabel: string;
  baseValue: number;
  lowValue: number; // valor al -delta%
  highValue: number; // valor al +delta%
  lowNpv: number; // VPN resultante al valor bajo
  highNpv: number; // VPN resultante al valor alto
  baseNpv: number;
  swing: number; // |highNpv - lowNpv|
}

export interface TwoDimensionalCell {
  xValue: number; // ej. Tasa de descuento (%)
  xLabel: string;
  yValue: number; // ej. Variación de Inversión / Ingresos (%)
  yLabel: string;
  npv: number;
  isViable: boolean;
}

export interface TwoDimensionalMatrixResult {
  xAxisName: string;
  xAxisLabel: string;
  yAxisName: string;
  yAxisLabel: string;
  xSteps: number[];
  ySteps: number[];
  matrix: TwoDimensionalCell[][];
}

export interface BreakevenAnalysisResult {
  variable: "discount_rate" | "initial_investment" | "inflow_multiplier";
  variableLabel: string;
  baseValue: number;
  breakevenValue: number;
  percentageChangeToBreakeven: number;
  interpretation: string;
}

/**
 * Ejecuta análisis de sensibilidad unidimensional (Gráfico Tornado)
 * Variando cada factor en un rango porcentual (ej. -20% a +20%)
 */
export function runOneDimensionalSensitivity(
  initialInvestment: number,
  cashFlows: FinancialCashFlow[],
  discountRate: number, // decimal, ej 0.12
  variationPct = 20, // variación estándar +-20%
): TornadoVariableResult[] {
  const baseNpv = calculateNPV(initialInvestment, cashFlows, discountRate);
  const factorLow = 1 - variationPct / 100;
  const factorHigh = 1 + variationPct / 100;

  const results: TornadoVariableResult[] = [];

  // 1. Sensibilidad a la Tasa de Descuento
  const rateLow = Math.max(0.001, discountRate * factorLow);
  const rateHigh = discountRate * factorHigh;
  const npvRateLow = calculateNPV(initialInvestment, cashFlows, rateLow);
  const npvRateHigh = calculateNPV(initialInvestment, cashFlows, rateHigh);
  results.push({
    variableName: "discount_rate",
    variableLabel: "Tasa de Descuento",
    baseValue: discountRate * 100,
    lowValue: rateLow * 100,
    highValue: rateHigh * 100,
    lowNpv: Math.round(npvRateLow),
    highNpv: Math.round(npvRateHigh),
    baseNpv: Math.round(baseNpv),
    swing: Math.abs(npvRateLow - npvRateHigh),
  });

  // 2. Sensibilidad a la Inversión Inicial (CAPEX)
  const invLow = initialInvestment * factorLow;
  const invHigh = initialInvestment * factorHigh;
  const npvInvLow = calculateNPV(invLow, cashFlows, discountRate);
  const npvInvHigh = calculateNPV(invHigh, cashFlows, discountRate);
  results.push({
    variableName: "initial_investment",
    variableLabel: "Inversión Inicial (CAPEX)",
    baseValue: initialInvestment,
    lowValue: invLow,
    highValue: invHigh,
    lowNpv: Math.round(npvInvLow),
    highNpv: Math.round(npvInvHigh),
    baseNpv: Math.round(baseNpv),
    swing: Math.abs(npvInvLow - npvInvHigh),
  });

  // 3. Sensibilidad a los Ingresos Operacionales
  const flowsInLow = cashFlows.map((f) => ({ ...f, inflow: f.inflow * factorLow }));
  const flowsInHigh = cashFlows.map((f) => ({ ...f, inflow: f.inflow * factorHigh }));
  const npvInLow = calculateNPV(initialInvestment, flowsInLow, discountRate);
  const npvInHigh = calculateNPV(initialInvestment, flowsInHigh, discountRate);
  results.push({
    variableName: "operational_inflows",
    variableLabel: "Ingresos Operacionales",
    baseValue: 100,
    lowValue: 100 * factorLow,
    highValue: 100 * factorHigh,
    lowNpv: Math.round(npvInLow),
    highNpv: Math.round(npvInHigh),
    baseNpv: Math.round(baseNpv),
    swing: Math.abs(npvInHigh - npvInLow),
  });

  // 4. Sensibilidad a los Costos Operacionales (Egresos)
  const flowsOutLow = cashFlows.map((f) => ({ ...f, outflow: f.outflow * factorLow }));
  const flowsOutHigh = cashFlows.map((f) => ({ ...f, outflow: f.outflow * factorHigh }));
  const npvOutLow = calculateNPV(initialInvestment, flowsOutLow, discountRate);
  const npvOutHigh = calculateNPV(initialInvestment, flowsOutHigh, discountRate);
  results.push({
    variableName: "operational_outflows",
    variableLabel: "Costos Operacionales",
    baseValue: 100,
    lowValue: 100 * factorLow,
    highValue: 100 * factorHigh,
    lowNpv: Math.round(npvOutLow),
    highNpv: Math.round(npvOutHigh),
    baseNpv: Math.round(baseNpv),
    swing: Math.abs(npvOutHigh - npvOutLow),
  });

  // Ordenar de mayor impacto a menor impacto (formato clásico de Tornado)
  return results.sort((a, b) => b.swing - a.swing);
}

/**
 * Ejecuta análisis bidimensional (Matriz Heatmap)
 * Eje X: Tasa de descuento (%)
 * Eje Y: Variación de Ingresos o Inversión (%)
 */
export function runTwoDimensionalSensitivity(
  initialInvestment: number,
  cashFlows: FinancialCashFlow[],
  baseRatePercent: number, // ej 12 para 12%
  xSteps = [-4, -2, 0, 2, 4], // deltas de tasa en % (ej. 8%, 10%, 12%, 14%, 16%)
  ySteps = [-20, -10, 0, 10, 20], // variaciones de ingresos en %
): TwoDimensionalMatrixResult {
  const xValues = xSteps.map((delta) => Math.max(0.5, baseRatePercent + delta));
  const matrix: TwoDimensionalCell[][] = [];

  for (const yDelta of ySteps) {
    const row: TwoDimensionalCell[] = [];
    const inflowFactor = 1 + yDelta / 100;
    const adjustedFlows = cashFlows.map((f) => ({ ...f, inflow: f.inflow * inflowFactor }));

    for (const rateVal of xValues) {
      const npv = calculateNPV(initialInvestment, adjustedFlows, rateVal / 100);
      row.push({
        xValue: rateVal,
        xLabel: `${rateVal.toFixed(1)}%`,
        yValue: yDelta,
        yLabel: `${yDelta >= 0 ? "+" : ""}${yDelta}%`,
        npv: Math.round(npv),
        isViable: npv >= 0,
      });
    }
    matrix.push(row);
  }

  return {
    xAxisName: "discount_rate",
    xAxisLabel: "Tasa de Descuento (%)",
    yAxisName: "inflow_variation",
    yAxisLabel: "Variación de Ingresos (%)",
    xSteps: xValues,
    ySteps,
    matrix,
  };
}

/**
 * Encuentra el Punto de Equilibrio (Breakeven / Umbral Crítico) donde VPN = 0
 */
export function findBreakevenPoint(
  initialInvestment: number,
  cashFlows: FinancialCashFlow[],
  discountRate: number,
  variable: "discount_rate" | "initial_investment" | "inflow_multiplier",
): BreakevenAnalysisResult {
  switch (variable) {
    case "discount_rate": {
      // El punto de equilibrio de la tasa de descuento es la TIR
      const irr = calculateIRR(initialInvestment, cashFlows);
      const breakevenRate = irr !== null ? irr * 100 : discountRate * 100;
      const baseRatePercent = discountRate * 100;
      const pctChange = ((breakevenRate - baseRatePercent) / baseRatePercent) * 100;

      return {
        variable: "discount_rate",
        variableLabel: "Tasa de Descuento Máxima Soportada (TIR)",
        baseValue: Math.round(baseRatePercent * 10) / 10,
        breakevenValue: Math.round(breakevenRate * 10) / 10,
        percentageChangeToBreakeven: Math.round(pctChange * 10) / 10,
        interpretation:
          pctChange >= 0
            ? `La tasa puede aumentar hasta un ${breakevenRate.toFixed(1)}% (+${pctChange.toFixed(1)}%) antes de que el proyecto deje de ser rentable.`
            : `El proyecto ya no es rentable a la tasa actual. Debería bajar a ${breakevenRate.toFixed(1)}% para equilibrarse.`,
      };
    }

    case "initial_investment": {
      // Valor presente de los flujos operacionales netos
      const pvNetFlows = cashFlows.reduce((sum, f) => {
        const net = f.inflow - f.outflow;
        return sum + net / Math.pow(1 + discountRate, f.period);
      }, 0);

      const maxInvestment = Math.max(0, pvNetFlows);
      const pctChange =
        initialInvestment > 0
          ? ((maxInvestment - initialInvestment) / initialInvestment) * 100
          : 0;

      return {
        variable: "initial_investment",
        variableLabel: "Inversión Inicial Máxima Admisible",
        baseValue: initialInvestment,
        breakevenValue: Math.round(maxInvestment),
        percentageChangeToBreakeven: Math.round(pctChange * 10) / 10,
        interpretation:
          pctChange >= 0
            ? `El proyecto tolera un sobrecosto en la inversión de hasta $${Math.round(maxInvestment - initialInvestment).toLocaleString()} (+${pctChange.toFixed(1)}%) manteniendo VPN >= 0.`
            : `La inversión actual excede la capacidad de pago del proyecto en $${Math.round(initialInvestment - maxInvestment).toLocaleString()}.`,
      };
    }

    case "inflow_multiplier": {
      const pvInflows = cashFlows.reduce(
        (sum, f) => sum + f.inflow / Math.pow(1 + discountRate, f.period),
        0,
      );
      const pvOutflows = cashFlows.reduce(
        (sum, f) => sum + f.outflow / Math.pow(1 + discountRate, f.period),
        0,
      );
      const pvTotalCosts = initialInvestment + pvOutflows;

      // Breakeven factor k * pvInflows = pvTotalCosts  =>  k = pvTotalCosts / pvInflows
      const factor = pvInflows > 0 ? pvTotalCosts / pvInflows : 1;
      const pctDrop = (factor - 1) * 100;

      return {
        variable: "inflow_multiplier",
        variableLabel: "Ingresos Mínimos Requeridos",
        baseValue: 100,
        breakevenValue: Math.round(factor * 100 * 10) / 10,
        percentageChangeToBreakeven: Math.round(pctDrop * 10) / 10,
        interpretation:
          pctDrop <= 0
            ? `Los ingresos pueden caer hasta un ${Math.abs(pctDrop).toFixed(1)}% sin que el proyecto incurra en pérdidas financieras.`
            : `Los ingresos actuales son insuficientes; requieren crecer un ${pctDrop.toFixed(1)}% para alcanzar el punto de equilibrio.`,
      };
    }
  }
}
