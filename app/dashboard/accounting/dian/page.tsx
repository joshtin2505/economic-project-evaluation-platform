"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchInvoices } from "@/lib/services/accounting-invoices";
import {
  getDianIntegrationStatus,
  prepareVatDeclaration,
  submitInvoiceToDian,
  type VatDeclarationPrep,
} from "@/lib/services/dian-integration";
import { formatCop } from "@/lib/utils/accounting-format";
import { toast } from "sonner";

export default function DianPage() {
  const now = new Date();
  const [from, setFrom] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`,
  );
  const [to, setTo] = useState(now.toISOString().slice(0, 10));
  const [vatPrep, setVatPrep] = useState<VatDeclarationPrep | null>(null);
  const [integrationStatus, setIntegrationStatus] = useState<{
    configured: boolean;
    providerUrl: string;
    phase: string;
  } | null>(null);
  const [saleInvoices, setSaleInvoices] = useState<
    Awaited<ReturnType<typeof fetchInvoices>>
  >([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [status, invoices, vat] = await Promise.all([
        getDianIntegrationStatus(),
        fetchInvoices("sale"),
        prepareVatDeclaration(from, to),
      ]);
      setIntegrationStatus(status);
      setSaleInvoices(invoices.filter((i) => i.status !== "draft"));
      setVatPrep(vat);
    } catch (err) {
      toast.error("Error al cargar datos DIAN");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSubmitDian = async (invoiceId: string) => {
    try {
      const result = await submitInvoiceToDian(invoiceId);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.info(result.message);
      }
      await loadData();
    } catch (err) {
      toast.error("Error al enviar a DIAN");
    }
  };

  const dianStatusLabel: Record<string, string> = {
    pending: "Pendiente",
    submitted: "Enviada",
    accepted: "Aceptada",
    rejected: "Rechazada",
    not_applicable: "N/A",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">DIAN y cumplimiento fiscal</h1>
        <p className="text-muted-foreground">
          Fase 2: integración con proveedor tecnológico e informes de IVA
        </p>
      </div>

      {integrationStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estado de integración</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4 items-center">
            <Badge variant={integrationStatus.configured ? "default" : "secondary"}>
              {integrationStatus.configured ? "API configurada" : "API no configurada"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {integrationStatus.phase}
            </span>
            {!integrationStatus.configured && (
              <span className="text-sm text-muted-foreground">
                Configure DIAN_PROVIDER_API_URL y DIAN_PROVIDER_API_KEY en variables de entorno.
              </span>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Declaración preparatoria de IVA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label>Desde</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Hasta</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <Button onClick={loadData}>Calcular</Button>
          </div>

          {loading ? (
            <p className="text-muted-foreground">Calculando...</p>
          ) : vatPrep ? (
            <div className="space-y-4">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell>Período</TableCell>
                    <TableCell className="text-right">{vatPrep.period}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Régimen tributario</TableCell>
                    <TableCell className="text-right capitalize">{vatPrep.regime}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>IVA generado</TableCell>
                    <TableCell className="text-right">{formatCop(vatPrep.vatGenerated)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>IVA descontable</TableCell>
                    <TableCell className="text-right">{formatCop(vatPrep.vatDeductible)}</TableCell>
                  </TableRow>
                  <TableRow className="font-bold">
                    <TableCell>Saldo IVA</TableCell>
                    <TableCell className="text-right">{formatCop(vatPrep.balanceDue)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <ul className="text-sm text-muted-foreground space-y-1">
                {vatPrep.notes.map((note, i) => (
                  <li key={i}>• {note}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Facturas de venta — envío DIAN</CardTitle>
        </CardHeader>
        <CardContent>
          {saleInvoices.length === 0 ? (
            <p className="text-muted-foreground">
              No hay facturas emitidas para enviar a la DIAN.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado DIAN</TableHead>
                  <TableHead>CUFE</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {saleInvoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.invoice_number || "—"}</TableCell>
                    <TableCell>{formatCop(Number(inv.total))}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {dianStatusLabel[inv.dian_status] ?? inv.dian_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {inv.dian_cufe || "—"}
                    </TableCell>
                    <TableCell>
                      {inv.dian_status !== "accepted" && inv.dian_status !== "submitted" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSubmitDian(inv.id)}
                        >
                          Enviar DIAN
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
