"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { fetchContacts } from "@/lib/services/accounting-contacts";
import {
  createInvoice,
  fetchInvoices,
  issueInvoice,
  markInvoicePaid,
} from "@/lib/services/accounting-invoices";
import { fetchProjects } from "@/lib/services/projects";
import { formatAccountingDate, formatCop } from "@/lib/utils/accounting-format";
import { toast } from "sonner";

const statusLabels: Record<string, string> = {
  draft: "Borrador",
  issued: "Emitida",
  paid: "Pagada",
  void: "Anulada",
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<
    Awaited<ReturnType<typeof fetchInvoices>>
  >([]);
  const [contacts, setContacts] = useState<{ id: string; name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const NONE = "__none__";
  const [form, setForm] = useState({
    invoice_type: "sale" as "sale" | "purchase",
    contact_id: NONE,
    project_id: NONE,
    issue_date: new Date().toISOString().slice(0, 10),
    description: "",
    quantity: "1",
    unit_price: "",
    tax_rate: "0.19",
  });

  const loadData = useCallback(async () => {
    try {
      const [inv, contactList, projectList] = await Promise.all([
        fetchInvoices(),
        fetchContacts(),
        fetchProjects(),
      ]);
      setInvoices(inv);
      setContacts(contactList.map((c) => ({ id: c.id, name: c.name })));
      setProjects(
        (projectList ?? []).map((p: { id: string; name: string }) => ({
          id: p.id,
          name: p.name,
        })),
      );
    } catch {
      toast.error("Error al cargar facturas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.unit_price) return;
    setSaving(true);
    try {
      const id = await createInvoice({
        invoice_type: form.invoice_type,
        contact_id: form.contact_id !== NONE ? form.contact_id : null,
        project_id: form.project_id !== NONE ? form.project_id : null,
        issue_date: form.issue_date,
        lines: [
          {
            description: form.description || "Ítem",
            quantity: parseFloat(form.quantity) || 1,
            unit_price: parseFloat(form.unit_price),
            tax_rate: parseFloat(form.tax_rate),
          },
        ],
      });
      toast.success("Factura creada en borrador");
      await loadData();
      setForm((f) => ({ ...f, description: "", unit_price: "" }));
    } catch (err) {
      toast.error("Error al crear factura");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleIssue = async (id: string) => {
    try {
      await issueInvoice(id);
      toast.success("Factura emitida");
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al emitir");
    }
  };

  const handlePay = async (id: string) => {
    try {
      await markInvoicePaid(id);
      toast.success("Factura marcada como pagada");
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al registrar pago");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Facturas</h1>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Lista</TabsTrigger>
          <TabsTrigger value="new">Nueva factura</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <p className="text-muted-foreground">Cargando...</p>
              ) : invoices.length === 0 ? (
                <p className="text-muted-foreground">No hay facturas.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell>
                          {inv.invoice_number || inv.id.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                          {inv.invoice_type === "sale" ? "Venta" : "Compra"}
                        </TableCell>
                        <TableCell>
                          {(inv.contacts as { name?: string } | null)?.name ?? "—"}
                        </TableCell>
                        <TableCell>
                          {formatAccountingDate(inv.issue_date)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {statusLabels[inv.status] ?? inv.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCop(Number(inv.total))}
                        </TableCell>
                        <TableCell className="space-x-1">
                          {inv.status === "draft" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleIssue(inv.id)}
                            >
                              Emitir
                            </Button>
                          )}
                          {inv.status === "issued" && (
                            <Button
                              size="sm"
                              onClick={() => handlePay(inv.id)}
                            >
                              Pagar
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
        </TabsContent>

        <TabsContent value="new" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Nueva factura (borrador)</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4 max-w-lg">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={form.invoice_type}
                    onValueChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        invoice_type: v as "sale" | "purchase",
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sale">Venta</SelectItem>
                      <SelectItem value="purchase">Compra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Contacto</Label>
                    <Select
                      value={form.contact_id}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, contact_id: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Opcional" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>Ninguno</SelectItem>
                        {contacts.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Proyecto</Label>
                    <Select
                      value={form.project_id}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, project_id: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Opcional" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>Ninguno</SelectItem>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issue_date">Fecha</Label>
                  <Input
                    id="issue_date"
                    type="date"
                    value={form.issue_date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, issue_date: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción del ítem</Label>
                  <Input
                    id="description"
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Cantidad</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={form.quantity}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, quantity: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit_price">Precio unitario</Label>
                    <Input
                      id="unit_price"
                      type="number"
                      min="0"
                      value={form.unit_price}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, unit_price: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tax_rate">IVA</Label>
                    <Input
                      id="tax_rate"
                      type="number"
                      step="0.01"
                      value={form.tax_rate}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, tax_rate: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : "Crear borrador"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
