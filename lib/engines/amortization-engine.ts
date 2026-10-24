/**
 * Motor de Amortización de Créditos (Pure Amortization Engine)
 * Modela sistemas de amortización Francés (cuota constante),
 * Alemán (amortización constante a capital), Americano (bullet) y períodos de gracia.
 */

export type LoanPaymentType = "french" | "german" | "american" | "custom";

export interface LoanInputParams {
  principal: number;
  annualRate: number; // porcentaje (ej: 14 para 14%)
  termPeriods: number; // número de períodos
  paymentType: LoanPaymentType;
  gracePeriods?: number; // períodos con solo pago de intereses o gracia total
  startPeriod?: number; // período de inicio (default 1)
}

export interface AmortizationRow {
  period: number;
  beginningBalance: number;
  payment: number;
  principalPayment: number;
  interestPayment: number;
  endingBalance: number;
}

export interface LoanScheduleSummary {
  principal: number;
  totalInterest: number;
  totalPayments: number;
  averagePayment: number;
  effectiveRate: number;
  schedule: AmortizationRow[];
}

/**
 * Sistema Francés: Cuota periódica fija constante
 * A = P * [ i * (1+i)^n ] / [ (1+i)^n - 1 ]
 */
export function calculateFrenchAmortization(
  principal: number,
  rateDecimal: number,
  termPeriods: number,
  gracePeriods = 0,
  startPeriod = 1,
): AmortizationRow[] {
  const schedule: AmortizationRow[] = [];
  let balance = principal;
  const activePeriods = termPeriods - gracePeriods;

  if (activePeriods <= 0) return [];

  // Cuota fija calculada para los períodos posteriores a la gracia
  const installment =
    rateDecimal === 0
      ? balance / activePeriods
      : balance *
        ((rateDecimal * Math.pow(1 + rateDecimal, activePeriods)) /
          (Math.pow(1 + rateDecimal, activePeriods) - 1));

  for (let t = 1; t <= termPeriods; t++) {
    const periodNumber = startPeriod + t - 1;
    const interest = balance * rateDecimal;

    let principalPay = 0;
    let payment = 0;

    if (t <= gracePeriods) {
      // Período de gracia: se pagan únicamente intereses
      payment = interest;
      principalPay = 0;
    } else {
      // Período regular: cuota fija
      payment = installment;
      principalPay = payment - interest;

      // Ajuste de redondeo en el último período
      if (t === termPeriods || principalPay > balance) {
        principalPay = balance;
        payment = principalPay + interest;
      }
    }

    const ending = Math.max(0, balance - principalPay);

    schedule.push({
      period: periodNumber,
      beginningBalance: Math.round(balance * 100) / 100,
      payment: Math.round(payment * 100) / 100,
      principalPayment: Math.round(principalPay * 100) / 100,
      interestPayment: Math.round(interest * 100) / 100,
      endingBalance: Math.round(ending * 100) / 100,
    });

    balance = ending;
  }

  return schedule;
}

/**
 * Sistema Alemán: Amortización a capital fija constante
 * AbonoCapital = P / n (constante), Intereses y Cuotas decrecientes
 */
export function calculateGermanAmortization(
  principal: number,
  rateDecimal: number,
  termPeriods: number,
  gracePeriods = 0,
  startPeriod = 1,
): AmortizationRow[] {
  const schedule: AmortizationRow[] = [];
  let balance = principal;
  const activePeriods = termPeriods - gracePeriods;

  if (activePeriods <= 0) return [];

  const fixedPrincipal = balance / activePeriods;

  for (let t = 1; t <= termPeriods; t++) {
    const periodNumber = startPeriod + t - 1;
    const interest = balance * rateDecimal;

    let principalPay = 0;
    let payment = 0;

    if (t <= gracePeriods) {
      payment = interest;
      principalPay = 0;
    } else {
      principalPay = t === termPeriods ? balance : fixedPrincipal;
      payment = principalPay + interest;
    }

    const ending = Math.max(0, balance - principalPay);

    schedule.push({
      period: periodNumber,
      beginningBalance: Math.round(balance * 100) / 100,
      payment: Math.round(payment * 100) / 100,
      principalPayment: Math.round(principalPay * 100) / 100,
      interestPayment: Math.round(interest * 100) / 100,
      endingBalance: Math.round(ending * 100) / 100,
    });

    balance = ending;
  }

  return schedule;
}

/**
 * Sistema Americano: Pago periódico de solo intereses y capital al final (Bullet)
 */
export function calculateAmericanAmortization(
  principal: number,
  rateDecimal: number,
  termPeriods: number,
  startPeriod = 1,
): AmortizationRow[] {
  const schedule: AmortizationRow[] = [];
  let balance = principal;

  for (let t = 1; t <= termPeriods; t++) {
    const periodNumber = startPeriod + t - 1;
    const interest = balance * rateDecimal;
    const isLast = t === termPeriods;

    const principalPay = isLast ? balance : 0;
    const payment = interest + principalPay;
    const ending = isLast ? 0 : balance;

    schedule.push({
      period: periodNumber,
      beginningBalance: Math.round(balance * 100) / 100,
      payment: Math.round(payment * 100) / 100,
      principalPayment: Math.round(principalPay * 100) / 100,
      interestPayment: Math.round(interest * 100) / 100,
      endingBalance: Math.round(ending * 100) / 100,
    });
  }

  return schedule;
}

/**
 * Genera la tabla completa de amortización y su resumen financiero
 */
export function generateAmortizationTable(input: LoanInputParams): LoanScheduleSummary {
  const rateDecimal = input.annualRate > 1 ? input.annualRate / 100 : input.annualRate;
  const grace = Math.max(0, input.gracePeriods || 0);
  const start = input.startPeriod ?? 1;

  let schedule: AmortizationRow[] = [];

  switch (input.paymentType) {
    case "german":
      schedule = calculateGermanAmortization(input.principal, rateDecimal, input.termPeriods, grace, start);
      break;
    case "american":
      schedule = calculateAmericanAmortization(input.principal, rateDecimal, input.termPeriods, start);
      break;
    case "french":
    default:
      schedule = calculateFrenchAmortization(input.principal, rateDecimal, input.termPeriods, grace, start);
      break;
  }

  const totalInterest = schedule.reduce((sum, r) => sum + r.interestPayment, 0);
  const totalPayments = schedule.reduce((sum, r) => sum + r.payment, 0);
  const averagePayment = schedule.length > 0 ? totalPayments / schedule.length : 0;

  return {
    principal: input.principal,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalPayments: Math.round(totalPayments * 100) / 100,
    averagePayment: Math.round(averagePayment * 100) / 100,
    effectiveRate: Math.round(rateDecimal * 10000) / 100,
    schedule,
  };
}
