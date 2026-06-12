"use server";

import { ensureAccountingSetup } from "@/lib/services/accounting-setup";
import { getSessionContext } from "@/lib/services/session-context";

interface PeriodAggregate {
  inflow: number;
  outflow: number;
}

function getPeriodFromDate(dateStr: string, projectStartYear?: number): number {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const baseYear = projectStartYear ?? year;
  return Math.max(1, year - baseYear + 1);
}

export async function syncProjectCashFlowsFromAccounting(projectId: string) {
  await ensureAccountingSetup();
  const { supabase, tenantId } = await getSessionContext();
  if (!tenantId) throw new Error("Tenant no configurado");

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, periods, created_at")
    .eq("id", projectId)
    .single();

  if (projectError) throw projectError;

  const projectStartYear = new Date(project.created_at).getFullYear();
  const maxPeriods = project.periods || 10;

  const { data: entries, error: entriesError } = await supabase
    .from("journal_entries")
    .select("entry_date, transaction_type, amount")
    .eq("project_id", projectId)
    .eq("tenant_id", tenantId)
    .eq("status", "posted");

  if (entriesError) throw entriesError;

  const byPeriod = new Map<number, PeriodAggregate>();

  for (const entry of entries ?? []) {
    const period = getPeriodFromDate(entry.entry_date, projectStartYear);
    if (period > maxPeriods) continue;

    const current = byPeriod.get(period) ?? { inflow: 0, outflow: 0 };
    const amount = Number(entry.amount);

    if (
      entry.transaction_type === "income" ||
      entry.transaction_type === "invoice_sale" ||
      (entry.transaction_type === "payment" && amount > 0)
    ) {
      current.inflow += amount;
    } else if (
      entry.transaction_type === "expense" ||
      entry.transaction_type === "invoice_purchase"
    ) {
      current.outflow += amount;
    }

    byPeriod.set(period, current);
  }

  const { error: deleteError } = await supabase
    .from("cash_flows")
    .delete()
    .eq("project_id", projectId)
    .eq("source", "from_accounting");

  if (deleteError) throw deleteError;

  const flowsPayload = Array.from(byPeriod.entries()).map(([period, agg]) => ({
    project_id: projectId,
    period,
    inflow: agg.inflow,
    outflow: agg.outflow,
    source: "from_accounting" as const,
  }));

  if (flowsPayload.length > 0) {
    const { error: insertError } = await supabase
      .from("cash_flows")
      .insert(flowsPayload);

    if (insertError) throw insertError;
  }

  return { periodsUpdated: flowsPayload.length };
}

export async function fetchProjectAccountingComparison(projectId: string) {
  const { supabase } = await getSessionContext();

  const { data: manualFlows, error: manualError } = await supabase
    .from("cash_flows")
    .select("period, inflow, outflow")
    .eq("project_id", projectId)
    .eq("source", "manual")
    .order("period");

  if (manualError) throw manualError;

  const { data: accountingFlows, error: accError } = await supabase
    .from("cash_flows")
    .select("period, inflow, outflow")
    .eq("project_id", projectId)
    .eq("source", "from_accounting")
    .order("period");

  if (accError) throw accError;

  const periods = new Set([
    ...(manualFlows ?? []).map((f) => f.period),
    ...(accountingFlows ?? []).map((f) => f.period),
  ]);

  return Array.from(periods)
    .sort((a, b) => a - b)
    .map((period) => {
      const manual = manualFlows?.find((f) => f.period === period);
      const actual = accountingFlows?.find((f) => f.period === period);
      const projectedNet =
        Number(manual?.inflow ?? 0) - Number(manual?.outflow ?? 0);
      const actualNet =
        Number(actual?.inflow ?? 0) - Number(actual?.outflow ?? 0);
      return {
        period,
        projectedInflow: Number(manual?.inflow ?? 0),
        projectedOutflow: Number(manual?.outflow ?? 0),
        projectedNet,
        actualInflow: Number(actual?.inflow ?? 0),
        actualOutflow: Number(actual?.outflow ?? 0),
        actualNet,
        variance: actualNet - projectedNet,
      };
    });
}

export async function syncAllProjectsFromAccounting() {
  const { supabase, tenantId } = await getSessionContext();
  if (!tenantId) throw new Error("Tenant no configurado");

  const { data: projects, error } = await supabase
    .from("projects")
    .select("id")
    .eq("tenant_id", tenantId);

  if (error) throw error;

  const results = [];
  for (const project of projects ?? []) {
    const result = await syncProjectCashFlowsFromAccounting(project.id);
    results.push({ projectId: project.id, ...result });
  }

  return results;
}
