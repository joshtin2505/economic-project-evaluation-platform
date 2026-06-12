"use server";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/services/session-context";

async function withTenantId(payload: Record<string, unknown>) {
  const { user, tenantId } = await getSessionContext();
  return {
    ...payload,
    user_id: user.id,
    tenant_id: tenantId,
  };
}

export async function fetchProjects() {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id,name,description,initial_investment,discount_rate,inflation,risk_premium,tmar_method,use_tmar_as_discount_rate,funding_sources,periods,status,results,updated_at",
    )
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function fetchProjectById(id: string) {
  const supabase = await createSupabaseClient();

  // Try to fetch with salvage_value column first
  let { data, error } = await supabase
    .from("projects")
    .select(
      "id,name,description,initial_investment,discount_rate,inflation,risk_premium,tmar_method,use_tmar_as_discount_rate,funding_sources,periods,results,salvage_value",
    )
    .eq("id", id)
    .single();

  // If salvage_value column doesn't exist, fetch without it
  if (error && error.code === "42703") {
    const { data: data2, error: error2 } = await supabase
      .from("projects")
      .select(
        "id,name,description,initial_investment,discount_rate,inflation,risk_premium,tmar_method,use_tmar_as_discount_rate,funding_sources,periods,results",
      )
      .eq("id", id)
      .single();

    if (error2) throw error2;
    // Add default salvage_value if column doesn't exist
    return { ...data2, salvage_value: 0 };
  }

  if (error) throw error;
  return data;
}

export async function fetchProjectBySearchTerm(term: string) {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id,name,description,initial_investment,discount_rate,inflation,risk_premium,tmar_method,use_tmar_as_discount_rate,funding_sources,periods,status,results,updated_at",
    )
    .or(`name.ilike.%${term}%,description.ilike.%${term}%`)
    .order("updated_at", { ascending: false });
  console.log(data);
  if (error) throw error;
  return data;
}

export async function fetchCashFlows(projectId: string) {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("cash_flows")
    .select("period,inflow,outflow")
    .eq("project_id", projectId)
    .order("period", { ascending: true });

  if (error) throw error;
  return data;
}

export async function deleteProject(id: string) {
  const supabase = await createSupabaseClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
  return true;
}

export async function createProjectWithFlows(payload: any, flows: any[]) {
  const supabase = await createSupabaseClient();
  const enriched = await withTenantId(payload);
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert(enriched)
    .select("id")
    .single();

  if (projectError) throw projectError;

  const flowsPayload = flows.map((flow) => ({
    project_id: project.id,
    period: flow.period,
    inflow: flow.inflow,
    outflow: flow.outflow,
  }));

  const { error: cashFlowsError } = await supabase
    .from("cash_flows")
    .insert(flowsPayload);
  if (cashFlowsError) throw cashFlowsError;

  return project;
}

export async function updateProjectWithFlows(
  id: string,
  payload: any,
  flows: any[],
) {
  const supabase = await createSupabaseClient();
  const { error: updateError } = await supabase
    .from("projects")
    .update(payload)
    .eq("id", id);
  if (updateError) throw updateError;

  const { error: delErr } = await supabase
    .from("cash_flows")
    .delete()
    .eq("project_id", id);
  if (delErr) throw delErr;

  const flowsPayload = flows.map((flow) => ({
    project_id: id,
    period: flow.period,
    inflow: flow.inflow,
    outflow: flow.outflow,
  }));

  const { error: cashFlowsError } = await supabase
    .from("cash_flows")
    .insert(flowsPayload);
  if (cashFlowsError) throw cashFlowsError;

  return true;
}
