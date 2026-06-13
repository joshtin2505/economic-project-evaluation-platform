"use server";

import { createClient as createSupabaseClient } from "@/lib/supabase/server";

export interface ProjectGroup {
  id: string;
  tenant_id: string;
  user_id: string;
  name: string;
  description: string;
  comparison_rate: number | null;
  selected_project_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectGroupMember {
  id: string;
  group_id: string;
  project_id: string;
  rank: number | null;
  notes: string;
  created_at: string;
}

/**
 * Obtiene todos los grupos de proyectos del usuario actual
 */
export async function fetchProjectGroups() {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("project_groups")
    .select(`
      id,
      name,
      description,
      comparison_rate,
      selected_project_id,
      created_at,
      updated_at
    `)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data as ProjectGroup[];
}

/**
 * Obtiene un grupo de proyectos por su ID, incluyendo sus miembros y la información básica del proyecto.
 */
export async function fetchProjectGroupById(id: string) {
  const supabase = await createSupabaseClient();

  const { data: group, error: groupError } = await supabase
    .from("project_groups")
    .select("*")
    .eq("id", id)
    .single();

  if (groupError) throw groupError;

  // Obtener los miembros vinculados y su respectivo proyecto
  const { data: members, error: membersError } = await supabase
    .from("project_group_members")
    .select(`
      id,
      group_id,
      project_id,
      rank,
      notes,
      projects (
        id,
        name,
        description,
        initial_investment,
        periods,
        discount_rate,
        inflation,
        risk_premium,
        tmar_method,
        use_tmar_as_discount_rate,
        funding_sources,
        status,
        results,
        updated_at
      )
    `)
    .eq("group_id", id)
    .order("rank", { ascending: true });

  if (membersError) throw membersError;

  return {
    ...group,
    members: members.map((m: any) => ({
      id: m.id,
      group_id: m.group_id,
      project_id: m.project_id,
      rank: m.rank,
      notes: m.notes,
      project: m.projects,
    })),
  };
}

/**
 * Crea un grupo de proyectos y asocia sus alternativas miembros
 */
export async function createProjectGroup(
  name: string,
  description: string,
  comparisonRate: number | null,
  projectIds: string[]
) {
  const supabase = await createSupabaseClient();
  
  // Obtener usuario actual
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("No se encontró sesión activa de usuario.");

  // Obtener el tenant_id del perfil del usuario
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();
  
  if (profileError || !profile) throw new Error("No se pudo resolver el Tenant del usuario.");
  const tenantId = profile.tenant_id;

  // Crear el grupo
  const { data: group, error: groupError } = await supabase
    .from("project_groups")
    .insert({
      name,
      description,
      comparison_rate: comparisonRate,
      user_id: user.id,
      tenant_id: tenantId,
    })
    .select("id")
    .single();

  if (groupError) throw groupError;

  // Si hay proyectos para asociar
  if (projectIds.length > 0) {
    const membersPayload = projectIds.map((projectId, idx) => ({
      group_id: group.id,
      project_id: projectId,
      rank: idx + 1,
      notes: "",
    }));

    const { error: membersError } = await supabase
      .from("project_group_members")
      .insert(membersPayload);

    if (membersError) throw membersError;
  }

  return group;
}

/**
 * Actualiza la información básica del grupo y gestiona sus miembros
 */
export async function updateProjectGroup(
  id: string,
  name: string,
  description: string,
  comparisonRate: number | null,
  projectIds: string[]
) {
  const supabase = await createSupabaseClient();

  // Actualizar el grupo principal
  const { error: groupError } = await supabase
    .from("project_groups")
    .update({
      name,
      description,
      comparison_rate: comparisonRate,
    })
    .eq("id", id);

  if (groupError) throw groupError;

  // Eliminar miembros actuales que no están en el nuevo arreglo
  const { error: deleteError } = await supabase
    .from("project_group_members")
    .delete()
    .eq("group_id", id);

  if (deleteError) throw deleteError;

  // Insertar los nuevos miembros
  if (projectIds.length > 0) {
    const membersPayload = projectIds.map((projectId, idx) => ({
      group_id: id,
      project_id: projectId,
      rank: idx + 1,
      notes: "",
    }));

    const { error: insertError } = await supabase
      .from("project_group_members")
      .insert(membersPayload);

    if (insertError) throw insertError;
  }

  return true;
}

/**
 * Elimina un grupo de proyectos (sus miembros se eliminan en cascada por constraint de BD)
 */
export async function deleteProjectGroup(id: string) {
  const supabase = await createSupabaseClient();
  const { error } = await supabase
    .from("project_groups")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return true;
}

/**
 * Establece el proyecto seleccionado (ganador) del grupo
 */
export async function selectWinningProject(groupId: string, projectId: string | null) {
  const supabase = await createSupabaseClient();
  const { error } = await supabase
    .from("project_groups")
    .update({
      selected_project_id: projectId,
    })
    .eq("id", groupId);

  if (error) throw error;
  return true;
}
