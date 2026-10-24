import { describe, it, expect } from "vitest";
import {
  calculateNPV,
  calculateNPVWithDisbursements,
  calculateIRR,
  calculateBenefitCostRatio,
  calculatePaybackPeriod,
  calculateProfitabilityIndex,
  calculateEquivalentAnnualWorth,
  generateProFormaIncomeStatement,
  generateFreeCashFlowStatement,
} from "./financial-engine";
import {
  calculateInflationRiskTmarPercent,
  calculateWeightedFundingTmarPercent,
  type FundingSource,
} from "../utils/tmar";
import { generateAmortizationTable } from "./amortization-engine";
import { calculateStraightLine, calculateSumOfYears } from "./depreciation-engine";

/**
 * Pruebas de Oro (Golden Tests) - Valores de referencia canónicos según docs/ai/TESTING.md
 */
describe("Financial Engine - Proyecto Dorado P-ORO", () => {
  // P-ORO: I0 = 1000, t=1..3 F=500, r = 10% (0.10)
  const initialInvestment = 1000;
  const cashFlows = [
    { period: 1, inflow: 500, outflow: 0 },
    { period: 2, inflow: 500, outflow: 0 },
    { period: 3, inflow: 500, outflow: 0 },
  ];
  const discountRate = 0.10;

  it("calcula VPN esperado = 243.43", () => {
    const npv = calculateNPV(initialInvestment, cashFlows, discountRate);
    expect(npv).toBeCloseTo(243.43, 2);
  });

  it("calcula TIR esperada = 23.38%", () => {
    const irr = calculateIRR(initialInvestment, cashFlows);
    expect(irr).not.toBeNull();
    expect(irr! * 100).toBeCloseTo(23.38, 2);
  });

  it("calcula Relación Beneficio/Costo esperada = 1.2434", () => {
    const bc = calculateBenefitCostRatio(initialInvestment, cashFlows, discountRate);
    expect(bc).toBeCloseTo(1.2434, 4);
  });

  it("calcula Payback Simple esperado = 2.0 periodos", () => {
    const payback = calculatePaybackPeriod(initialInvestment, cashFlows, 0);
    expect(payback).toBeCloseTo(2.0, 2);
  });

  it("calcula Payback Descontado esperado", () => {
    // A 10%: F1_desc = 454.55, F2_desc = 413.22 (acumulado = 867.77 < 1000)
    // F3_desc = 375.66. Remanente a recuperar = 1000 - 867.77 = 132.23
    // Fracción = 132.23 / 375.66 = 0.352 -> 2.35 períodos
    const discountedPayback = calculatePaybackPeriod(initialInvestment, cashFlows, discountRate);
    expect(discountedPayback).toBeCloseTo(2.35, 2);
  });

  it("calcula Índice de Rentabilidad esperado = 1.2434", () => {
    const pi = calculateProfitabilityIndex(initialInvestment, cashFlows, discountRate);
    expect(pi).toBeCloseTo(1.2434, 4);
  });

  it("calcula BAUE esperado = 97.89", () => {
    const npv = calculateNPV(initialInvestment, cashFlows, discountRate);
    const baue = calculateEquivalentAnnualWorth(npv, discountRate, 3);
    expect(baue).toBeCloseTo(97.89, 2);
  });
});

describe("Desembolsos Multi-Período y Períodos Negativos", () => {
  it("descuenta desembolsos pre-operativos (t < 0) y desembolsos diferidos (t > 0)", () => {
    // Desembolso de 500 en t = -1 (valor capitalizado a t=0 es 500 * (1.10)^1 = 550)
    // Desembolso de 500 en t = 0
    // Total CAPEX en t=0 = 1050
    // Flujos: 600 en t=1, 600 en t=2
    // VP(flujos) = 600/1.1 + 600/1.21 = 545.45 + 495.87 = 1041.32
    // VPN = 1041.32 - 1050 = -8.68
    const disbursements = [
      { period: -1, plannedAmount: 500 },
      { period: 0, plannedAmount: 500 },
    ];
    const cashFlows = [
      { period: 1, inflow: 600, outflow: 0 },
      { period: 2, inflow: 600, outflow: 0 },
    ];
    const npv = calculateNPVWithDisbursements(disbursements, cashFlows, 0.10);
    expect(npv).toBeCloseTo(-8.68, 1);
  });
});

describe("Casos Borde Financieros", () => {
  it("maneja tasa de descuento 0% correctamente", () => {
    const cashFlows = [
      { period: 1, inflow: 300, outflow: 100 }, // 200
      { period: 2, inflow: 400, outflow: 100 }, // 300
    ];
    // Inversión 400, flujos netos = 500 => VPN = 100
    const npv = calculateNPV(400, cashFlows, 0);
    expect(npv).toBe(100);
  });

  it("retorna null en TIR cuando los flujos son todos negativos (sin cambio de signo)", () => {
    const negativeFlows = [
      { period: 1, inflow: 0, outflow: 100 },
      { period: 2, inflow: 0, outflow: 100 },
    ];
    const irr = calculateIRR(1000, negativeFlows);
    expect(irr).toBeNull();
  });

  it("maneja flujos vacíos sin fallar", () => {
    const npv = calculateNPV(500, [], 0.10);
    expect(npv).toBe(-500);
    const irr = calculateIRR(500, []);
    expect(irr).toBeNull();
  });
});

describe("Pro-Forma y Flujos Libres", () => {
  it("genera Estado de Resultados Pro-Forma con deducción de intereses y depreciación", () => {
    const revenues = [{ period: 1, amount: 10000 }];
    const costs = [{ period: 1, amount: 4000 }];
    const dep = [{ period: 1, amount: 2000 }];
    const interest = [{ period: 1, amount: 1000 }];
    // EBITDA = 6,000; EBIT = 4,000; EBT = 3,000; Taxes (35%) = 1,050; Net Income = 1,950
    const result = generateProFormaIncomeStatement(1, revenues, costs, dep, interest, 35);
    expect(result[0].ebitda).toBe(6000);
    expect(result[0].ebit).toBe(4000);
    expect(result[0].ebt).toBe(3000);
    expect(result[0].taxes).toBe(1050);
    expect(result[0].netIncome).toBe(1950);
  });

  it("genera Flujo de Caja Libre (FCFF) y Flujo del Accionista (FCFE)", () => {
    const incomeRows = [
      {
        period: 1,
        revenue: 10000,
        operatingCosts: 4000,
        ebitda: 6000,
        depreciation: 2000,
        ebit: 4000,
        interestExpense: 1000,
        ebt: 3000,
        taxes: 1050,
        netIncome: 1950,
      },
    ];
    // Capex = 500, DeltaWk = 200, DebtIn = 1000, DebtRepayment = 300
    // FCFF = NetIncome (1950) + Dep (2000) - Capex (500) - DeltaWk (200) = 3250
    // FCFE = FCFF (3250) + DebtIn (1000) - DebtRepayment (300) = 3950
    const fcf = generateFreeCashFlowStatement(
      incomeRows,
      [{ period: 1, amount: 500 }],
      [{ period: 1, amount: 1000 }],
      [{ period: 1, amount: 300 }],
      [{ period: 1, amount: 200 }],
    );

    expect(fcf[0].freeCashFlowFirm).toBe(3250);
    expect(fcf[0].freeCashFlowEquity).toBe(3950);
  });
});

describe("TMAR - Valores de Oro", () => {
  it("calcula TMAR Simple (Fisher): inflación 5%, riesgo 4% => 9.20%", () => {
    const tmar = calculateInflationRiskTmarPercent(5, 4);
    expect(tmar).toBeCloseTo(9.20, 2);
  });

  it("calcula TMAR Mixta: 40%@15%, 45%@10%, 15%@12% => 12.30%", () => {
    const sources: FundingSource[] = [
      { id: "1", name: "Propio", share: 40, cost: 15 },
      { id: "2", name: "Banco", share: 45, cost: 10 },
      { id: "3", name: "Coop", share: 15, cost: 12 },
    ];
    const tmar = calculateWeightedFundingTmarPercent(sources);
    expect(tmar).toBeCloseTo(12.30, 2);
  });
});
