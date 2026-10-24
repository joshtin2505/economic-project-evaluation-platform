"use server";

import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import {
  generateAmortizationTable,
  type LoanPaymentType,
  type AmortizationRow,
  type LoanScheduleSummary,
} from "@/lib/engines/amortization-engine";
import { buildCapitalStructure, type CapitalStructureSummary } from "@/lib/engines/wacc-engine";
import { fetchProjectById } from "./projects";

export interface ProjectLoanRecord {
  id: string;
  project_id: string;
  lender_name: string;
  principal: number;
  annual_rate: number;
  term_periods: number;
  payment_type: LoanPaymentType;
  grace_periods: number;
  start_period: number;
  disbursement_schedule: any[];
  account_code: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectLoansOverview {
  loans: ProjectLoanRecord[];
  totalPrincipal: number;
  totalInterest: number;
  annualInterestByPeriod: Map<number, number>;
  annualPrincipalByPeriod: Map<number, number>;
  capitalStructure: CapitalStructureSummary;
}

/**
 * Obtiene todos los créditos vinculados a un proyecto
 */
export async function fetchLoansByProject(projectId: string): Promise<ProjectLoanRecord[]> {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("project_loans")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data || []) as ProjectLoanRecord[];
}

/**
 * Obtiene un crédito con su tabla detallada de amortización
 */
export async function fetchLoanWithAmortization(loanId: string) {
  const supabase = await createSupabaseClient();

  const { data: loan, error: loanErr } = await supabase
    .from("project_loans")
    .select("*")
    .eq("id", loanId)
    .single();

  if (loanErr || !loan) throw new Error("Crédito no encontrado");

  const { data: rows, error: rowsErr } = await supabase
    .from("loan_amortization")
    .select("*")
    .eq("loan_id", loanId)
    .order("period", { ascending: true });

  if (rowsErr) throw rowsErr;

  return {
    ...loan,
    amortization: (rows || []).map((r: any) => ({
      period: r.period,
      beginningBalance: Number(r.beginning_balance),
      payment: Number(r.payment),
      principalPayment: Number(r.principal_payment),
      interestPayment: Number(r.interest_payment),
      endingBalance: Number(r.ending_balance),
    })) as AmortizationRow[],
  };
}

/**
 * Crea un crédito y genera automáticamente su tabla de amortización en BD
 */
export async function createLoan(input: {
  project_id: string;
  lender_name: string;
  principal: number;
  annual_rate: number;
  term_periods: number;
  payment_type: LoanPaymentType;
  grace_periods?: number;
  start_period?: number;
  account_code?: string;
}): Promise<ProjectLoanRecord> {
  const supabase = await createSupabaseClient();

  // 1. Insertar el crédito
  const { data: loan, error } = await supabase
    .from("project_loans")
    .insert({
      project_id: input.project_id,
      lender_name: input.lender_name,
      principal: input.principal,
      annual_rate: input.annual_rate,
      term_periods: input.term_periods,
      payment_type: input.payment_type,
      grace_periods: input.grace_periods ?? 0,
      start_period: input.start_period ?? 1,
      account_code: input.account_code ?? "",
    })
    .select()
    .single();

  if (error) throw error;

  // 2. Generar y almacenar tabla de amortización
  const summary = generateAmortizationTable({
    principal: Number(loan.principal),
    annualRate: Number(loan.annual_rate),
    termPeriods: Number(loan.term_periods),
    paymentType: loan.payment_type,
    gracePeriods: Number(loan.grace_periods),
    startPeriod: Number(loan.start_period),
  });

  const amortizationPayload = summary.schedule.map((row) => ({
    loan_id: loan.id,
    period: row.period,
    beginning_balance: row.beginningBalance,
    payment: row.payment,
    principal_payment: row.principalPayment,
    interest_payment: row.interestPayment,
    ending_balance: row.endingBalance,
  }));

  if (amortizationPayload.length > 0) {
    await supabase.from("loan_amortization").insert(amortizationPayload);
  }

  return loan as ProjectLoanRecord;
}

/**
 * Actualiza un crédito y recalcula su tabla de amortización
 */
export async function updateLoan(
  id: string,
  input: Partial<ProjectLoanRecord>,
): Promise<ProjectLoanRecord> {
  const supabase = await createSupabaseClient();

  const { data: updated, error } = await supabase
    .from("project_loans")
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  // Eliminar filas de amortización anteriores
  await supabase.from("loan_amortization").delete().eq("loan_id", id);

  // Recalcular e insertar nuevas filas
  const summary = generateAmortizationTable({
    principal: Number(updated.principal),
    annualRate: Number(updated.annual_rate),
    termPeriods: Number(updated.term_periods),
    paymentType: updated.payment_type,
    gracePeriods: Number(updated.grace_periods),
    startPeriod: Number(updated.start_period),
  });

  const amortizationPayload = summary.schedule.map((row) => ({
    loan_id: updated.id,
    period: row.period,
    beginning_balance: row.beginningBalance,
    payment: row.payment,
    principal_payment: row.principalPayment,
    interest_payment: row.interestPayment,
    ending_balance: row.endingBalance,
  }));

  if (amortizationPayload.length > 0) {
    await supabase.from("loan_amortization").insert(amortizationPayload);
  }

  return updated as ProjectLoanRecord;
}

/**
 * Elimina un crédito (y su amortización en cascada)
 */
export async function deleteLoan(id: string): Promise<boolean> {
  const supabase = await createSupabaseClient();
  const { error } = await supabase.from("project_loans").delete().eq("id", id);
  if (error) throw error;
  return true;
}

/**
 * Obtiene el consolidado de financiamiento y WACC del proyecto
 */
export async function fetchProjectLoansOverview(projectId: string): Promise<ProjectLoansOverview> {
  const project = await fetchProjectById(projectId);
  const loans = await fetchLoansByProject(projectId);
  const supabase = await createSupabaseClient();

  let totalPrincipal = 0;
  let totalInterest = 0;
  const annualInterestByPeriod = new Map<number, number>();
  const annualPrincipalByPeriod = new Map<number, number>();

  for (const loan of loans) {
    totalPrincipal += Number(loan.principal || 0);

    const { data: rows } = await supabase
      .from("loan_amortization")
      .select("period, interest_payment, principal_payment")
      .eq("loan_id", loan.id);

    (rows || []).forEach((r: any) => {
      const p = Number(r.period);
      const interest = Number(r.interest_payment || 0);
      const principal = Number(r.principal_payment || 0);

      totalInterest += interest;
      annualInterestByPeriod.set(p, (annualInterestByPeriod.get(p) || 0) + interest);
      annualPrincipalByPeriod.set(p, (annualPrincipalByPeriod.get(p) || 0) + principal);
    });
  }

  const baseInvestment = Number(project?.initial_investment || 0);
  const equityRate = Number(project?.discount_rate || 15);

  const capitalStructure = buildCapitalStructure(
    loans.map((l) => ({ principal: Number(l.principal), annualRate: Number(l.annual_rate) })),
    baseInvestment,
    equityRate,
    35,
  );

  return {
    loans,
    totalPrincipal,
    totalInterest: Math.round(totalInterest),
    annualInterestByPeriod,
    annualPrincipalByPeriod,
    capitalStructure,
  };
}
