/**
 * Motor Financiero Puro (Pure Financial Engine)
 * Contiene funciones matemáticas para la evaluación de proyectos de inversión
 * sin dependencias de frameworks o bases de datos.
 * Soporta desembolsos multi-período, períodos pre-operativos negativos y flujos operacionales.
 */

export interface FinancialCashFlow {
  period: number;
  inflow: number;
  outflow: number;
}

export interface InvestmentDisbursementFlow {
  period: number;
  plannedAmount: number;
  actualAmount?: number;
}

/**
 * Calcula el Valor Presente Neto (VPN / NPV)
 *
 * Formula: VPN = -InversiónInicial + Suma( (Ingreso - Egreso) / (1 + r)^t )
 * Soporta periodos negativos (t < 0) donde (1 + r)^t descuenta al año 0 como valor futuro.
 *
 * @param initialInvestment Inversión inicial en t=0 (número positivo)
 * @param cashFlows Flujos de efectivo por período
 * @param discountRate Tasa de descuento en decimal (ej. 0.12 para 12%)
 */
export function calculateNPV(
  initialInvestment: number,
  cashFlows: FinancialCashFlow[],
  discountRate: number,
): number {
  if (discountRate <= -1) {
    throw new Error(
      "El 'discountRate' debe ser estrictamente mayor a -1 (-100%) para evitar división por cero.",
    );
  }
  const netFlows = cashFlows.reduce((sum, flow) => {
    const netFlow = flow.inflow - flow.outflow;
    return sum + netFlow / Math.pow(1 + discountRate, flow.period);
  }, 0);
  return -initialInvestment + netFlows;
}

/**
 * Calcula el VPN consolidando un cronograma detallado de desembolsos de inversión
 * distribuidos en múltiples períodos (incluyendo períodos pre-operativos negativos).
 *
 * @param disbursements Cronograma de desembolsos
 * @param cashFlows Flujos operacionales del proyecto
 * @param discountRate Tasa de descuento en decimal
 * @param useActual Si es true, usa el monto real ejecutado si está disponible; de lo contrario usa el planificado
 */
export function calculateNPVWithDisbursements(
  disbursements: InvestmentDisbursementFlow[],
  cashFlows: FinancialCashFlow[],
  discountRate: number,
  useActual = false,
): number {
  if (discountRate <= -1) {
    throw new Error("El 'discountRate' debe ser mayor a -1.");
  }

  // Valor presente de los desembolsos de inversión
  const pvDisbursements = disbursements.reduce((sum, d) => {
    const amount = useActual && d.actualAmount !== undefined && d.actualAmount !== null
      ? d.actualAmount
      : d.plannedAmount;
    return sum + amount / Math.pow(1 + discountRate, d.period);
  }, 0);

  // Valor presente de los flujos operacionales
  const pvCashFlows = cashFlows.reduce((sum, flow) => {
    const netFlow = flow.inflow - flow.outflow;
    return sum + netFlow / Math.pow(1 + discountRate, flow.period);
  }, 0);

  return -pvDisbursements + pvCashFlows;
}

/**
 * Calcula la Tasa Interna de Retorno (TIR / IRR) usando el método de Newton-Raphson.
 *
 * @param initialInvestment Inversión inicial (número positivo)
 * @param cashFlows Flujos de efectivo por período
 * @param estimateRate Estimación inicial de la tasa (default: 0.1 / 10%)
 * @param maxIterations Número máximo de iteraciones (default: 100)
 * @param tolerance Tolerancia de error aceptable (default: 1e-6)
 */
export function calculateIRR(
  initialInvestment: number,
  cashFlows: FinancialCashFlow[],
  estimateRate = 0.1,
  maxIterations = 100,
  tolerance = 1e-6,
): number | null {
  if (!cashFlows || cashFlows.length === 0) {
    return null;
  }

  // Verificar regla de signos de Descartes: debe haber al menos un flujo positivo
  const hasPositiveFlow = cashFlows.some((f) => f.inflow - f.outflow > 0);
  if (!hasPositiveFlow) {
    return null;
  }

  let rate = estimateRate;
  let converged = false;

  for (let i = 0; i < maxIterations; i++) {
    const npv = calculateNPV(initialInvestment, cashFlows, rate);

    // Calcular la derivada con respecto a la tasa (r)
    const derivative = cashFlows.reduce((sum, flow) => {
      const netFlow = flow.inflow - flow.outflow;
      return (
        sum - (flow.period * netFlow) / Math.pow(1 + rate, flow.period + 1)
      );
    }, 0);

    if (Math.abs(derivative) < 1e-12) {
      break;
    }

    const nextRate = rate - npv / derivative;

    if (Math.abs(nextRate - rate) < tolerance) {
      rate = nextRate;
      converged = true;
      break;
    }

    rate = nextRate;
  }

  // Si no converge o resulta en un valor inválido o no anula el VPN
  if (
    !converged ||
    isNaN(rate) ||
    !isFinite(rate) ||
    rate < -0.99 ||
    Math.abs(calculateNPV(initialInvestment, cashFlows, rate)) > 0.05
  ) {
    return null;
  }

  return rate;
}

/**
 * Calcula la TIR considerando el cronograma de desembolsos multi-período
 */
export function calculateIRRWithDisbursements(
  disbursements: InvestmentDisbursementFlow[],
  cashFlows: FinancialCashFlow[],
  useActual = false,
  estimateRate = 0.1,
  maxIterations = 100,
  tolerance = 1e-6,
): number | null {
  if (!disbursements || disbursements.length === 0 || !cashFlows || cashFlows.length === 0) {
    return null;
  }

  const hasPositiveFlow = cashFlows.some((f) => f.inflow - f.outflow > 0);
  if (!hasPositiveFlow) {
    return null;
  }

  let rate = estimateRate;
  let converged = false;

  for (let i = 0; i < maxIterations; i++) {
    const npv = calculateNPVWithDisbursements(disbursements, cashFlows, rate, useActual);

    // Derivada de los desembolsos respecto a rate: d/dr [- D / (1+r)^t] = t * D / (1+r)^(t+1)
    const dDisbursements = disbursements.reduce((sum, d) => {
      const amount = useActual && d.actualAmount !== undefined && d.actualAmount !== null
        ? d.actualAmount
        : d.plannedAmount;
      return sum + (d.period * amount) / Math.pow(1 + rate, d.period + 1);
    }, 0);

    // Derivada de los flujos operacionales: d/dr [ F / (1+r)^t ] = -t * F / (1+r)^(t+1)
    const dCashFlows = cashFlows.reduce((sum, flow) => {
      const netFlow = flow.inflow - flow.outflow;
      return sum - (flow.period * netFlow) / Math.pow(1 + rate, flow.period + 1);
    }, 0);

    const derivative = dDisbursements + dCashFlows;

    if (Math.abs(derivative) < 1e-12) {
      break;
    }

    const nextRate = rate - npv / derivative;

    if (Math.abs(nextRate - rate) < tolerance) {
      rate = nextRate;
      converged = true;
      break;
    }

    rate = nextRate;
  }

  if (
    !converged ||
    isNaN(rate) ||
    !isFinite(rate) ||
    rate < -0.99 ||
    Math.abs(calculateNPVWithDisbursements(disbursements, cashFlows, rate, useActual)) > 0.05
  ) {
    return null;
  }

  return rate;
}

/**
 * Calcula la relación Beneficio/Costo (B/C Ratio)
 *
 * Formula: B/C = VP(Beneficios) / VP(Costos)
 * Donde los costos incluyen la inversión inicial y flujos negativos.
 *
 * @param initialInvestment Inversión inicial (número positivo)
 * @param cashFlows Flujos de efectivo por período
 * @param discountRate Tasa de descuento en decimal (ej. 0.12 para 12%)
 */
export function calculateBenefitCostRatio(
  initialInvestment: number,
  cashFlows: FinancialCashFlow[],
  discountRate: number,
): number {
  const pvBenefits = cashFlows
    .filter((flow) => flow.inflow > 0)
    .reduce(
      (sum, flow) =>
        sum + flow.inflow / Math.pow(1 + discountRate, flow.period),
      0,
    );

  const pvCosts =
    initialInvestment +
    cashFlows
      .filter((flow) => flow.outflow > 0)
      .reduce(
        (sum, flow) =>
          sum + flow.outflow / Math.pow(1 + discountRate, flow.period),
        0,
      );

  if (pvCosts === 0) return 0;
  return pvBenefits / pvCosts;
}

/**
 * Calcula el Periodo de Recuperación (Payback Period / PRI).
 * Si se especifica un discountRate > 0, calcula el payback period descontado.
 *
 * @param initialInvestment Inversión inicial (número positivo)
 * @param cashFlows Flujos de efectivo por período
 * @param discountRate Tasa de descuento opcional para payback descontado (decimal)
 */
export function calculatePaybackPeriod(
  initialInvestment: number,
  cashFlows: FinancialCashFlow[],
  discountRate = 0,
): number | null {
  const sortedFlows = [...cashFlows].sort((a, b) => a.period - b.period);
  let cumulative = -initialInvestment;

  for (let i = 0; i < sortedFlows.length; i++) {
    const flow = sortedFlows[i];
    const netFlow = flow.inflow - flow.outflow;
    const discountedNetFlow =
      discountRate > 0
        ? netFlow / Math.pow(1 + discountRate, flow.period)
        : netFlow;

    const previousCumulative = cumulative;
    cumulative += discountedNetFlow;

    if (cumulative >= 0) {
      const fraction =
        discountedNetFlow === 0
          ? 0
          : Math.abs(previousCumulative) / discountedNetFlow;
      return flow.period - 1 + fraction;
    }
  }

  return null;
}

/**
 * Calcula el Índice de Rentabilidad (Profitability Index)
 *
 * Formula: IR = (VPN / InversiónInicial) + 1
 *
 * @param initialInvestment Inversión inicial (número positivo)
 * @param cashFlows Flujos de efectivo por período
 * @param discountRate Tasa de descuento en decimal (ej. 0.12 para 12%)
 */
export function calculateProfitabilityIndex(
  initialInvestment: number,
  cashFlows: FinancialCashFlow[],
  discountRate: number,
): number {
  if (initialInvestment === 0) return 0;
  const npv = calculateNPV(initialInvestment, cashFlows, discountRate);
  return npv / initialInvestment + 1;
}

export interface ProFormaIncomeRow {
  period: number;
  revenue: number;
  operatingCosts: number;
  ebitda: number;
  depreciation: number;
  ebit: number;
  interestExpense: number;
  ebt: number;
  taxes: number;
  netIncome: number;
}

export interface FreeCashFlowRow {
  period: number;
  netIncome: number;
  depreciation: number;
  capex: number;
  workingCapitalDelta: number;
  debtDisbursements: number;
  debtPrincipalRepayment: number;
  freeCashFlowFirm: number; // FCFF / Flujo de Caja Libre
  freeCashFlowEquity: number; // FCFE / Flujo de Caja del Accionista
}

/**
 * Calcula el Beneficio Anual Uniforme Equivalente (BAUE / CAUE)
 * Formula: BAUE = VPN * [ r * (1 + r)^n ] / [ (1 + r)^n - 1 ]
 *
 * @param npv Valor Presente Neto del proyecto
 * @param discountRate Tasa de descuento en decimal (ej: 0.12)
 * @param periods Número de períodos de vida útil
 */
export function calculateEquivalentAnnualWorth(
  npv: number,
  discountRate: number,
  periods: number,
): number {
  if (periods <= 0) return npv;
  if (discountRate === 0) return npv / periods;

  const factor =
    (discountRate * Math.pow(1 + discountRate, periods)) /
    (Math.pow(1 + discountRate, periods) - 1);
  return Math.round(npv * factor * 100) / 100;
}

/**
 * Genera el Estado de Resultados Proyectado (Pro-Forma Income Statement)
 */
export function generateProFormaIncomeStatement(
  periods: number,
  revenues: { period: number; amount: number }[],
  operatingCosts: { period: number; amount: number }[],
  depreciationSchedule: { period: number; amount: number }[],
  interestSchedule: { period: number; amount: number }[],
  taxRatePercent = 35,
): ProFormaIncomeRow[] {
  const statement: ProFormaIncomeRow[] = [];
  const taxRate = taxRatePercent / 100;

  for (let t = 1; t <= periods; t++) {
    const rev = revenues.find((r) => r.period === t)?.amount || 0;
    const costs = operatingCosts.find((c) => c.period === t)?.amount || 0;
    const ebitda = rev - costs;

    const dep = depreciationSchedule.find((d) => d.period === t)?.amount || 0;
    const ebit = ebitda - dep;

    const interest = interestSchedule.find((i) => i.period === t)?.amount || 0;
    const ebt = ebit - interest;

    // Si EBT es positivo paga impuestos, si es negativo no genera impuesto corriente
    const taxes = ebt > 0 ? ebt * taxRate : 0;
    const netIncome = ebt - taxes;

    statement.push({
      period: t,
      revenue: Math.round(rev),
      operatingCosts: Math.round(costs),
      ebitda: Math.round(ebitda),
      depreciation: Math.round(dep),
      ebit: Math.round(ebit),
      interestExpense: Math.round(interest),
      ebt: Math.round(ebt),
      taxes: Math.round(taxes),
      netIncome: Math.round(netIncome),
    });
  }

  return statement;
}

/**
 * Genera el Flujo de Caja Libre (FCL) y Flujo del Accionista (FCA)
 */
export function generateFreeCashFlowStatement(
  incomeStatement: ProFormaIncomeRow[],
  capexSchedule: { period: number; amount: number }[],
  debtDisbursements: { period: number; amount: number }[] = [],
  debtPrincipalRepayments: { period: number; amount: number }[] = [],
  workingCapitalDeltaSchedule: { period: number; amount: number }[] = [],
): FreeCashFlowRow[] {
  return incomeStatement.map((income) => {
    const t = income.period;
    const capex = capexSchedule.find((c) => c.period === t)?.amount || 0;
    const deltaWk = workingCapitalDeltaSchedule.find((w) => w.period === t)?.amount || 0;
    const debtIn = debtDisbursements.find((d) => d.period === t)?.amount || 0;
    const debtOut = debtPrincipalRepayments.find((d) => d.period === t)?.amount || 0;

    // FCL (Flujo de Caja Libre / FCFF) sin efecto de deuda
    const fcff = income.netIncome + income.depreciation - capex - deltaWk;

    // FCA (Flujo de Caja del Accionista / FCFE) con efecto de deuda
    const fcfe = fcff + debtIn - debtOut;

    return {
      period: t,
      netIncome: income.netIncome,
      depreciation: income.depreciation,
      capex,
      workingCapitalDelta: deltaWk,
      debtDisbursements: debtIn,
      debtPrincipalRepayment: debtOut,
      freeCashFlowFirm: Math.round(fcff),
      freeCashFlowEquity: Math.round(fcfe),
    };
  });
}
