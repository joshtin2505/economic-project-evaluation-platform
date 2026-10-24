"use server";

import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import {
  generateDepreciationSchedule,
  type DepreciationMethod,
  type DepreciationRow,
  type AssetDepreciationSummary,
} from "@/lib/engines/depreciation-engine";

export type AssetCategory =
  | "land"
  | "building"
  | "equipment"
  | "vehicle"
  | "furniture"
  | "intangible"
  | "other";

export interface ProjectAssetRecord {
  id: string;
  project_id: string;
  name: string;
  category: AssetCategory;
  acquisition_cost: number;
  salvage_value: number;
  useful_life_periods: number;
  depreciation_method: DepreciationMethod;
  acquisition_period: number;
  account_code_asset: string;
  account_code_depreciation: string;
  account_code_accumulated: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectAssetsOverview {
  assets: ProjectAssetRecord[];
  totalAcquisitionCost: number;
  totalSalvageValue: number;
  totalDepreciableBase: number;
  annualDepreciationByPeriod: Map<number, number>;
  bookValueByPeriod: Map<number, number>;
}

export const ASSET_CATEGORY_LABELS: Record<AssetCategory, string> = {
  land: "Terrenos (No Depreciable)",
  building: "Edificaciones y Obras",
  equipment: "Maquinaria y Equipos",
  vehicle: "Vehículos y Transporte",
  furniture: "Muebles y Enseres",
  intangible: "Intangibles y Licencias",
  other: "Otros Activos Fijos",
};

/**
 * Obtiene todos los activos de un proyecto
 */
export async function fetchAssetsByProject(projectId: string): Promise<ProjectAssetRecord[]> {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase
    .from("project_assets")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data || []) as ProjectAssetRecord[];
}

/**
 * Obtiene un activo con su cronograma de depreciación
 */
export async function fetchAssetWithDepreciation(assetId: string) {
  const supabase = await createSupabaseClient();

  const { data: asset, error: assetErr } = await supabase
    .from("project_assets")
    .select("*")
    .eq("id", assetId)
    .single();

  if (assetErr || !asset) throw new Error("Activo no encontrado");

  const { data: rows, error: rowsErr } = await supabase
    .from("asset_depreciation")
    .select("*")
    .eq("asset_id", assetId)
    .order("period", { ascending: true });

  if (rowsErr) throw rowsErr;

  return {
    ...asset,
    depreciationSchedule: (rows || []).map((r: any) => ({
      period: r.period,
      depreciationExpense: Number(r.depreciation_expense),
      accumulatedDepreciation: Number(r.accumulated_depreciation),
      bookValue: Number(r.book_value),
    })) as DepreciationRow[],
  };
}

/**
 * Registra un activo y genera automáticamente su depreciación período a período en BD
 */
export async function createAsset(input: {
  project_id: string;
  name: string;
  category: AssetCategory;
  acquisition_cost: number;
  salvage_value?: number;
  useful_life_periods: number;
  depreciation_method: DepreciationMethod;
  acquisition_period?: number;
  account_code_asset?: string;
  account_code_depreciation?: string;
  account_code_accumulated?: string;
}): Promise<ProjectAssetRecord> {
  const supabase = await createSupabaseClient();

  const { data: asset, error } = await supabase
    .from("project_assets")
    .insert({
      project_id: input.project_id,
      name: input.name,
      category: input.category,
      acquisition_cost: input.acquisition_cost,
      salvage_value: input.salvage_value ?? 0,
      useful_life_periods: input.useful_life_periods,
      depreciation_method: input.depreciation_method,
      acquisition_period: input.acquisition_period ?? 0,
      account_code_asset: input.account_code_asset ?? "",
      account_code_depreciation: input.account_code_depreciation ?? "",
      account_code_accumulated: input.account_code_accumulated ?? "",
    })
    .select()
    .single();

  if (error) throw error;

  // Los terrenos no se deprecian
  if (asset.category !== "land") {
    const summary = generateDepreciationSchedule({
      acquisitionCost: Number(asset.acquisition_cost),
      salvageValue: Number(asset.salvage_value),
      usefulLifePeriods: Number(asset.useful_life_periods),
      depreciationMethod: asset.depreciation_method,
      acquisitionPeriod: Number(asset.acquisition_period),
    });

    const rowsPayload = summary.schedule.map((r) => ({
      asset_id: asset.id,
      period: r.period,
      depreciation_expense: r.depreciationExpense,
      accumulated_depreciation: r.accumulatedDepreciation,
      book_value: r.bookValue,
    }));

    if (rowsPayload.length > 0) {
      await supabase.from("asset_depreciation").insert(rowsPayload);
    }
  }

  return asset as ProjectAssetRecord;
}

/**
 * Actualiza un activo y recalcula su cronograma
 */
export async function updateAsset(
  id: string,
  input: Partial<ProjectAssetRecord>,
): Promise<ProjectAssetRecord> {
  const supabase = await createSupabaseClient();

  const { data: updated, error } = await supabase
    .from("project_assets")
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  await supabase.from("asset_depreciation").delete().eq("asset_id", id);

  if (updated.category !== "land") {
    const summary = generateDepreciationSchedule({
      acquisitionCost: Number(updated.acquisition_cost),
      salvageValue: Number(updated.salvage_value),
      usefulLifePeriods: Number(updated.useful_life_periods),
      depreciationMethod: updated.depreciation_method,
      acquisitionPeriod: Number(updated.acquisition_period),
    });

    const rowsPayload = summary.schedule.map((r) => ({
      asset_id: updated.id,
      period: r.period,
      depreciation_expense: r.depreciationExpense,
      accumulated_depreciation: r.accumulatedDepreciation,
      book_value: r.bookValue,
    }));

    if (rowsPayload.length > 0) {
      await supabase.from("asset_depreciation").insert(rowsPayload);
    }
  }

  return updated as ProjectAssetRecord;
}

/**
 * Elimina un activo
 */
export async function deleteAsset(id: string): Promise<boolean> {
  const supabase = await createSupabaseClient();
  const { error } = await supabase.from("project_assets").delete().eq("id", id);
  if (error) throw error;
  return true;
}

/**
 * Obtiene el resumen consolidado de activos y depreciación de un proyecto
 */
export async function fetchProjectAssetsOverview(projectId: string): Promise<ProjectAssetsOverview> {
  const assets = await fetchAssetsByProject(projectId);
  const supabase = await createSupabaseClient();

  let totalAcquisitionCost = 0;
  let totalSalvageValue = 0;
  const annualDepreciationByPeriod = new Map<number, number>();
  const bookValueByPeriod = new Map<number, number>();

  for (const asset of assets) {
    totalAcquisitionCost += Number(asset.acquisition_cost || 0);
    totalSalvageValue += Number(asset.salvage_value || 0);

    const { data: rows } = await supabase
      .from("asset_depreciation")
      .select("period, depreciation_expense, book_value")
      .eq("asset_id", asset.id);

    (rows || []).forEach((r: any) => {
      const p = Number(r.period);
      const dep = Number(r.depreciation_expense || 0);
      const bv = Number(r.book_value || 0);

      annualDepreciationByPeriod.set(p, (annualDepreciationByPeriod.get(p) || 0) + dep);
      bookValueByPeriod.set(p, (bookValueByPeriod.get(p) || 0) + bv);
    });
  }

  return {
    assets,
    totalAcquisitionCost: Math.round(totalAcquisitionCost),
    totalSalvageValue: Math.round(totalSalvageValue),
    totalDepreciableBase: Math.max(0, Math.round(totalAcquisitionCost - totalSalvageValue)),
    annualDepreciationByPeriod,
    bookValueByPeriod,
  };
}
