"use server";

import { fetchProjectById, fetchCashFlows } from "./projects";
import { fetchDisbursementsByProject } from "./disbursements";
import { fetchProjectLoansOverview } from "./loans";
import { fetchProjectAssetsOverview } from "./assets";
import {
  generateProFormaIncomeStatement,
  generateFreeCashFlowStatement,
  calculateEquivalentAnnualWorth,
  calculateNPV,
  type ProFormaIncomeRow,
  type FreeCashFlowRow,
  type FinancialCashFlow,
} from "@/lib/engines/financial-engine";

export interface ProjectProFormaReport {
  projectId: string;
  projectName: string;
  periods: number;
  discountRate: number;
  taxRate: number;
  incomeStatement: ProFormaIncomeRow[];
  cashFlowStatement: FreeCashFlowRow[];
  totalRevenues: number;
  totalOperatingCosts: number;
  totalEbitda: number;
  totalDepreciation: number;
  totalInterest: number;
  totalTaxes: number;
  totalNetIncome: number;
  totalFreeCashFlowFirm: number;
  totalFreeCashFlowEquity: number;
  unleveragedNpv: number;
  leveragedNpv: number;
  baueUnleveraged: number;
  baueLeveraged: number;
}

export async function generateProjectProFormaReport(
  projectId: string,
  taxRatePercent = 35,
): Promise<ProjectProFormaReport> {
  const [project, rawCashFlows, disbursements, loansOverview, assetsOverview] = await Promise.all([
    fetchProjectById(projectId),
    fetchCashFlows(projectId),
    fetchDisbursementsByProject(projectId),
    fetchProjectLoansOverview(projectId),
    fetchProjectAssetsOverview(projectId),
  ]);

  if (!project) throw new Error("Proyecto no encontrado");

  const periods = Math.max(Number(project.periods || 5), 1);
  const discountRateDecimal = (Number(project.discount_rate) || 12) / 100;
  const initialInv = Number(project.initial_investment || 0);

  // 1. Mapear ingresos y costos operativos de cash_flows
  const revenues: { period: number; amount: number }[] = [];
  const operatingCosts: { period: number; amount: number }[] = [];

  (rawCashFlows || []).forEach((f: any) => {
    const p = Number(f.period);
    revenues.push({ period: p, amount: Number(f.inflow || 0) });
    operatingCosts.push({ period: p, amount: Number(f.outflow || 0) });
  });

  // 2. Mapear depreciación de activos
  const depreciationSchedule: { period: number; amount: number }[] = [];
  assetsOverview.annualDepreciationByPeriod.forEach((amount, period) => {
    depreciationSchedule.push({ period, amount });
  });

  // 3. Mapear intereses y capital de créditos
  const interestSchedule: { period: number; amount: number }[] = [];
  const principalRepayments: { period: number; amount: number }[] = [];

  loansOverview.annualInterestByPeriod.forEach((amount, period) => {
    interestSchedule.push({ period, amount });
  });
  loansOverview.annualPrincipalByPeriod.forEach((amount, period) => {
    principalRepayments.push({ period, amount });
  });

  // 4. Mapear desembolsos CAPEX y desembolsos de deuda
  const capexSchedule: { period: number; amount: number }[] = [];
  disbursements.forEach((d) => {
    const p = Number(d.period);
    if (p > 0) {
      capexSchedule.push({ period: p, amount: Number(d.planned_amount || 0) });
    }
  });

  const debtDisbursements: { period: number; amount: number }[] = [];
  loansOverview.loans.forEach((l) => {
    const p = Number(l.start_period || 0);
    if (p > 0) {
      debtDisbursements.push({ period: p, amount: Number(l.principal || 0) });
    }
  });

  // 5. Generar Estado de Resultados Pro-Forma
  const incomeStatement = generateProFormaIncomeStatement(
    periods,
    revenues,
    operatingCosts,
    depreciationSchedule,
    interestSchedule,
    taxRatePercent,
  );

  // 6. Generar Estado de Flujo de Caja Libre y del Accionista
  const cashFlowStatement = generateFreeCashFlowStatement(
    incomeStatement,
    capexSchedule,
    debtDisbursements,
    principalRepayments,
  );

  // 7. Totales agregados
  const totalRevenues = incomeStatement.reduce((s, r) => s + r.revenue, 0);
  const totalOperatingCosts = incomeStatement.reduce((s, r) => s + r.operatingCosts, 0);
  const totalEbitda = incomeStatement.reduce((s, r) => s + r.ebitda, 0);
  const totalDepreciation = incomeStatement.reduce((s, r) => s + r.depreciation, 0);
  const totalInterest = incomeStatement.reduce((s, r) => s + r.interestExpense, 0);
  const totalTaxes = incomeStatement.reduce((s, r) => s + r.taxes, 0);
  const totalNetIncome = incomeStatement.reduce((s, r) => s + r.netIncome, 0);
  const totalFreeCashFlowFirm = cashFlowStatement.reduce((s, r) => s + r.freeCashFlowFirm, 0);
  const totalFreeCashFlowEquity = cashFlowStatement.reduce((s, r) => s + r.freeCashFlowEquity, 0);

  // 8. VPN y BAUE desapalancado vs apalancado
  const fcffFlows: FinancialCashFlow[] = cashFlowStatement.map((r) => ({
    period: r.period,
    inflow: r.freeCashFlowFirm >= 0 ? r.freeCashFlowFirm : 0,
    outflow: r.freeCashFlowFirm < 0 ? Math.abs(r.freeCashFlowFirm) : 0,
  }));

  const fcfeFlows: FinancialCashFlow[] = cashFlowStatement.map((r) => ({
    period: r.period,
    inflow: r.freeCashFlowEquity >= 0 ? r.freeCashFlowEquity : 0,
    outflow: r.freeCashFlowEquity < 0 ? Math.abs(r.freeCashFlowEquity) : 0,
  }));

  const initialEquity = Math.max(0, initialInv - loansOverview.totalPrincipal);

  const unleveragedNpv = calculateNPV(initialInv, fcffFlows, discountRateDecimal);
  const leveragedNpv = calculateNPV(initialEquity, fcfeFlows, discountRateDecimal);

  const baueUnleveraged = calculateEquivalentAnnualWorth(unleveragedNpv, discountRateDecimal, periods);
  const baueLeveraged = calculateEquivalentAnnualWorth(leveragedNpv, discountRateDecimal, periods);

  return {
    projectId,
    projectName: project.name,
    periods,
    discountRate: Number(project.discount_rate || 12),
    taxRate: taxRatePercent,
    incomeStatement,
    cashFlowStatement,
    totalRevenues,
    totalOperatingCosts,
    totalEbitda,
    totalDepreciation,
    totalInterest,
    totalTaxes,
    totalNetIncome,
    totalFreeCashFlowFirm,
    totalFreeCashFlowEquity,
    unleveragedNpv: Math.round(unleveragedNpv),
    leveragedNpv: Math.round(leveragedNpv),
    baueUnleveraged,
    baueLeveraged,
  };
}
