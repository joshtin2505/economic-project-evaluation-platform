"use server";

import { getSessionContext } from "@/lib/services/session-context";

export interface ContactInput {
  contact_type: "customer" | "supplier" | "both";
  tax_id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface ContactRow {
  id: string;
  contact_type: string;
  tax_id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  created_at: string;
}

export async function fetchContacts(type?: "customer" | "supplier") {
  const { supabase, tenantId } = await getSessionContext();
  if (!tenantId) throw new Error("Tenant no configurado");

  let query = supabase
    .from("contacts")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("name");

  if (type === "customer") {
    query = query.in("contact_type", ["customer", "both"]);
  } else if (type === "supplier") {
    query = query.in("contact_type", ["supplier", "both"]);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as ContactRow[];
}

export async function createContact(input: ContactInput) {
  const { supabase, user, tenantId } = await getSessionContext();
  if (!tenantId) throw new Error("Tenant no configurado");

  const { data, error } = await supabase
    .from("contacts")
    .insert({
      tenant_id: tenantId,
      user_id: user.id,
      contact_type: input.contact_type,
      tax_id: input.tax_id ?? "",
      name: input.name,
      email: input.email ?? "",
      phone: input.phone ?? "",
      address: input.address ?? "",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as ContactRow;
}

export async function updateContact(id: string, input: Partial<ContactInput>) {
  const { supabase, tenantId } = await getSessionContext();
  if (!tenantId) throw new Error("Tenant no configurado");

  const { error } = await supabase
    .from("contacts")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", tenantId);

  if (error) throw error;
  return true;
}

export async function deleteContact(id: string) {
  const { supabase, tenantId } = await getSessionContext();
  if (!tenantId) throw new Error("Tenant no configurado");

  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenantId);

  if (error) throw error;
  return true;
}
