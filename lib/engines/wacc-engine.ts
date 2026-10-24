/**
 * Motor de Costo de Capital y Estructura Financiera (WACC Engine)
 * Calcula el Costo Promedio Ponderado de Capital (WACC / CPPC),
 * escudo fiscal por intereses (Tax Shield) y evaluación apalancada.
 */

export interface LoanItemForWacc {
  principal: number;
  annualRate: number; // porcentaje, ej 12 para 12%
}

export interface CapitalStructureSummary {
  totalInvestment: number;
  totalDebt: number;
  totalEquity: number;
  debtWeight: number; // Wd (0 a 1)
  equityWeight: number; // We (0 a 1)
  costOfDebtBeforeTax: number; // Kd (%)
  costOfDebtAfterTax: number; // Kd * (1 - T) (%)
  costOfEquity: number; // Ke (%)
  taxRate: number; // T (%)
  wacc: number; // CPPC (%)
}

/**
 * Calcula la fórmula clásica de WACC:
 * WACC = We * Ke + Wd * Kd * (1 - T)
 */
export function calculateWacc(
  equityCost: number, // Ke (%)
  debtCost: number, // Kd (%)
  equityWeight: number, // We (0 a 1)
  debtWeight: number, // Wd (0 a 1)
  taxRate = 35, // T (%) tasa impositiva
): number {
  const ke = equityCost / 100;
  const kd = debtCost / 100;
  const t = taxRate / 100;

  const waccDecimal = equityWeight * ke + debtWeight * kd * (1 - t);
  return Math.round(waccDecimal * 10000) / 100;
}

/**
 * Construye la estructura de capital y resuelve el WACC ponderado para un proyecto
 */
export function buildCapitalStructure(
  loans: LoanItemForWacc[],
  totalInvestment: number,
  costOfEquityPercent = 15,
  taxRatePercent = 35,
): CapitalStructureSummary {
  const totalDebt = loans.reduce((sum, l) => sum + Number(l.principal || 0), 0);
  const totalEquity = Math.max(0, totalInvestment - totalDebt);

  const effectiveTotal = Math.max(totalInvestment, totalDebt + totalEquity, 1);
  const debtWeight = Math.min(1, totalDebt / effectiveTotal);
  const equityWeight = Math.max(0, 1 - debtWeight);

  // Tasa ponderada de la deuda (Kd)
  const weightedDebtInterest = loans.reduce(
    (sum, l) => sum + Number(l.principal || 0) * (Number(l.annualRate || 0) / 100),
    0,
  );
  const costOfDebtBeforeTax =
    totalDebt > 0 ? (weightedDebtInterest / totalDebt) * 100 : 0;

  const costOfDebtAfterTax = costOfDebtBeforeTax * (1 - taxRatePercent / 100);

  const wacc = calculateWacc(
    costOfEquityPercent,
    costOfDebtBeforeTax,
    equityWeight,
    debtWeight,
    taxRatePercent,
  );

  return {
    totalInvestment,
    totalDebt,
    totalEquity,
    debtWeight: Math.round(debtWeight * 1000) / 1000,
    equityWeight: Math.round(equityWeight * 1000) / 1000,
    costOfDebtBeforeTax: Math.round(costOfDebtBeforeTax * 100) / 100,
    costOfDebtAfterTax: Math.round(costOfDebtAfterTax * 100) / 100,
    costOfEquity: Math.round(costOfEquityPercent * 100) / 100,
    taxRate: taxRatePercent,
    wacc,
  };
}
