/**
 * Motor Financiero Puro (Pure Financial Engine)
 * Contiene funciones matemáticas para la evaluación de proyectos de inversión
 * sin dependencias de frameworks o bases de datos.
 */

export interface FinancialCashFlow {
  period: number;
  inflow: number;
  outflow: number;
}

/**
 * Calcula el Valor Presente Neto (VPN / NPV)
 * 
 * Formula: VPN = -InversiónInicial + Suma( (Ingreso - Egreso) / (1 + r)^t )
 * 
 * @param initialInvestment Inversión inicial (número positivo)
 * @param cashFlows Flujos de efectivo por período
 * @param discountRate Tasa de descuento en decimal (ej. 0.12 para 12%)
 */
export function calculateNPV(
  initialInvestment: number,
  cashFlows: FinancialCashFlow[],
  discountRate: number
): number {
  const netFlows = cashFlows.reduce((sum, flow) => {
    const netFlow = flow.inflow - flow.outflow;
    return sum + netFlow / Math.pow(1 + discountRate, flow.period);
  }, 0);
  return -initialInvestment + netFlows;
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
  tolerance = 1e-6
): number | null {
  let rate = estimateRate;
  
  for (let i = 0; i < maxIterations; i++) {
    const npv = calculateNPV(initialInvestment, cashFlows, rate);
    
    // Calcular la derivada con respecto a la tasa (r)
    const derivative = cashFlows.reduce((sum, flow) => {
      const netFlow = flow.inflow - flow.outflow;
      return sum - (flow.period * netFlow) / Math.pow(1 + rate, flow.period + 1);
    }, 0);
    
    if (Math.abs(derivative) < 1e-12) {
      break;
    }
    
    const nextRate = rate - npv / derivative;
    
    if (Math.abs(nextRate - rate) < tolerance) {
      return nextRate;
    }
    
    rate = nextRate;
  }
  
  // Si no converge o resulta en un valor inválido, retornar null
  if (isNaN(rate) || !isFinite(rate) || rate < -0.99) {
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
  discountRate: number
): number {
  // Suma del valor presente de los ingresos (beneficios)
  const pvBenefits = cashFlows
    .filter(flow => flow.inflow > 0)
    .reduce((sum, flow) => sum + flow.inflow / Math.pow(1 + discountRate, flow.period), 0);

  // Suma del valor presente de los egresos (costos), incluyendo la inversión inicial
  const pvCosts = initialInvestment + cashFlows
    .filter(flow => flow.outflow > 0)
    .reduce((sum, flow) => sum + flow.outflow / Math.pow(1 + discountRate, flow.period), 0);

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
  discountRate = 0
): number | null {
  const sortedFlows = [...cashFlows].sort((a, b) => a.period - b.period);
  let cumulative = -initialInvestment;
  
  for (let i = 0; i < sortedFlows.length; i++) {
    const flow = sortedFlows[i];
    const netFlow = flow.inflow - flow.outflow;
    const discountedNetFlow = discountRate > 0 
      ? netFlow / Math.pow(1 + discountRate, flow.period) 
      : netFlow;
      
    const previousCumulative = cumulative;
    cumulative += discountedNetFlow;
    
    if (cumulative >= 0) {
      const fraction = discountedNetFlow === 0 ? 0 : Math.abs(previousCumulative) / discountedNetFlow;
      return flow.period - 1 + fraction;
    }
  }
  
  return null; // No se recupera en los periodos evaluados
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
  discountRate: number
): number {
  if (initialInvestment === 0) return 0;
  const npv = calculateNPV(initialInvestment, cashFlows, discountRate);
  return (npv / initialInvestment) + 1;
}
