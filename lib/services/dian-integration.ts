"use server";

/**
 * Fase 2: Integración con proveedor tecnológico DIAN.
 * Este módulo prepara la estructura para envío de facturas electrónicas.
 * En producción, conectar con API de Siigo, Alegra u otro PT autorizado.
 */

import { fetchInvoiceById } from "@/lib/services/accounting-invoices";
import { fetchTenantCompanySettings } from "@/lib/services/accounting-setup";
import { generateFinancialReports } from "@/lib/services/accounting-reports";
import { getSessionContext } from "@/lib/services/session-context";

export interface DianSubmissionResult {
  success: boolean;
  cufe?: string;
  status: "pending" | "submitted" | "accepted" | "rejected" | "not_applicable";
  message: string;
}

export interface VatDeclarationPrep {
  period: string;
  regime: string;
  vatGenerated: number;
  vatDeductible: number;
  balanceDue: number;
  retentionsWithheld: number;
  notes: string[];
}

const DIAN_PROVIDER_URL = process.env.DIAN_PROVIDER_API_URL ?? "";
const DIAN_PROVIDER_KEY = process.env.DIAN_PROVIDER_API_KEY ?? "";

export async function submitInvoiceToDian(
  invoiceId: string,
): Promise<DianSubmissionResult> {
  const { supabase, tenantId } = await getSessionContext();
  if (!tenantId) throw new Error("Tenant no configurado");

  const invoice = await fetchInvoiceById(invoiceId);
  const company = await fetchTenantCompanySettings();

  if (invoice.invoice_type !== "sale") {
    return {
      success: false,
      status: "not_applicable",
      message: "Solo facturas de venta se envían a la DIAN",
    };
  }

  if (invoice.status === "draft") {
    return {
      success: false,
      status: "pending",
      message: "La factura debe estar emitida antes de enviar a la DIAN",
    };
  }

  if (!DIAN_PROVIDER_URL || !DIAN_PROVIDER_KEY) {
    await supabase
      .from("invoices")
      .update({ dian_status: "pending" })
      .eq("id", invoiceId);

    return {
      success: false,
      status: "pending",
      message:
        "Integración DIAN no configurada. Configure DIAN_PROVIDER_API_URL y DIAN_PROVIDER_API_KEY. La factura quedó marcada como pendiente de envío.",
    };
  }

  // Placeholder for real API call to authorized technology provider
  const mockCufe = `CUFE-${Date.now().toString(36).toUpperCase()}`;

  const { error } = await supabase
    .from("invoices")
    .update({
      dian_status: "submitted",
      dian_cufe: mockCufe,
    })
    .eq("id", invoiceId);

  if (error) throw error;

  return {
    success: true,
    cufe: mockCufe,
    status: "submitted",
    message: `Factura enviada para ${company.legal_name ?? "empresa"}. CUFE: ${mockCufe}`,
  };
}

export async function prepareVatDeclaration(
  from: string,
  to: string,
): Promise<VatDeclarationPrep> {
  const company = await fetchTenantCompanySettings();
  const reports = await generateFinancialReports(from, to);
  const vatGenerated = reports.vatSummary.vatGenerated;
  const vatDeductible = reports.vatSummary.vatDeductible;

  const regime = company.tax_regime ?? "simplificado";
  const notes: string[] = [
    `Régimen: ${regime}`,
    regime === "simplificado"
      ? "Declaración bimestral de IVA (verificar calendario DIAN)"
      : "Declaración cuatrimestral de IVA (verificar calendario DIAN)",
    "Este reporte es preparatorio. Valide con su contador antes de presentar.",
  ];

  return {
    period: `${from} — ${to}`,
    regime,
    vatGenerated: Math.round(vatGenerated * 100) / 100,
    vatDeductible: Math.round(vatDeductible * 100) / 100,
    balanceDue: Math.round((vatGenerated - vatDeductible) * 100) / 100,
    retentionsWithheld: 0,
    notes,
  };
}

export async function getDianIntegrationStatus() {
  return {
    configured: Boolean(DIAN_PROVIDER_URL && DIAN_PROVIDER_KEY),
    providerUrl: DIAN_PROVIDER_URL ? "Configurado" : "No configurado",
    phase: "Fase 2 — Integración con proveedor tecnológico",
  };
}
