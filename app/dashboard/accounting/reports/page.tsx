"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  generateFinancialReports,
  exportReportsToCsv,
  type FinancialReports,
} from "@/lib/services/accounting-reports";
import { formatCop } from "@/lib/utils/accounting-format";
import { Download, FileText, Printer } from "lucide-react";
import { toast } from "sonner";

export default function AccountingReportsPage() {
  const reportRef = useRef<HTMLDivElement>(null);
  const now = new Date();
  const [from, setFrom] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`,
  );
  const [to, setTo] = useState(now.toISOString().slice(0, 10));
  const [reports, setReports] = useState<FinancialReports | null>(null);
  const [loading, setLoading] = useState(true);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const data = await generateFinancialReports(from, to);
      setReports(data);
    } catch (err) {
      toast.error("Error al generar reportes");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const handleExportCsv = async () => {
    try {
      const csv = await exportReportsToCsv(from, to);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reportes-contables-${from}-${to}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV descargado");
    } catch {
      toast.error("Error al exportar");
    }
  };

  const handleExportPdf = async () => {
    if (!reportRef.current) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;
      const canvas = await html2canvas(reportRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`reportes-contables-${from}-${to}.pdf`);
      toast.success("PDF descargado");
    } catch {
      toast.error("Error al generar PDF");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-bold">Reportes financieros</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExportCsv}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button variant="outline" onClick={handleExportPdf}>
            <FileText className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-2">
          <Label htmlFor="from">Desde</Label>
          <Input
            id="from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="to">Hasta</Label>
          <Input
            id="to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <Button onClick={loadReports}>Actualizar</Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Generando reportes...</p>
      ) : reports ? (
        <div ref={reportRef} className="space-y-6">
          <Tabs defaultValue="income">
            <TabsList>
              <TabsTrigger value="income">Estado de resultados</TabsTrigger>
              <TabsTrigger value="balance">Balance</TabsTrigger>
              <TabsTrigger value="cashflow">Flujo de caja</TabsTrigger>
              <TabsTrigger value="vat">IVA</TabsTrigger>
            </TabsList>

            <TabsContent value="income" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Estado de resultados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Ingresos</h3>
                    <Table>
                      <TableBody>
                        {reports.incomeStatement.income.map((line) => (
                          <TableRow key={line.code}>
                            <TableCell>
                              {line.code} — {line.name}
                            </TableCell>
                            <TableCell className="text-right text-green-600">
                              {formatCop(line.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-bold">
                          <TableCell>Total ingresos</TableCell>
                          <TableCell className="text-right text-green-600">
                            {formatCop(reports.incomeStatement.totalIncome)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Gastos</h3>
                    <Table>
                      <TableBody>
                        {reports.incomeStatement.expenses.map((line) => (
                          <TableRow key={line.code}>
                            <TableCell>
                              {line.code} — {line.name}
                            </TableCell>
                            <TableCell className="text-right text-red-600">
                              {formatCop(line.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-bold">
                          <TableCell>Total gastos</TableCell>
                          <TableCell className="text-right text-red-600">
                            {formatCop(reports.incomeStatement.totalExpenses)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  <div className="rounded-lg bg-muted p-4 flex justify-between font-bold text-lg">
                    <span>Utilidad neta</span>
                    <span
                      className={
                        reports.incomeStatement.netIncome >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {formatCop(reports.incomeStatement.netIncome)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="balance" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Balance general simplificado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-3">
                    {[
                      { title: "Activos", items: reports.balanceSheet.assets, total: reports.balanceSheet.totalAssets },
                      { title: "Pasivos", items: reports.balanceSheet.liabilities, total: reports.balanceSheet.totalLiabilities },
                      { title: "Patrimonio", items: reports.balanceSheet.equity, total: reports.balanceSheet.totalEquity },
                    ].map((section) => (
                      <div key={section.title}>
                        <h3 className="font-semibold mb-2">{section.title}</h3>
                        <Table>
                          <TableBody>
                            {section.items.length === 0 ? (
                              <TableRow>
                                <TableCell className="text-muted-foreground">
                                  Sin movimientos
                                </TableCell>
                              </TableRow>
                            ) : (
                              section.items.map((item) => (
                                <TableRow key={item.code}>
                                  <TableCell className="text-sm">
                                    {item.name}
                                  </TableCell>
                                  <TableCell className="text-right text-sm">
                                    {formatCop(item.balance)}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                            <TableRow className="font-bold">
                              <TableCell>Total</TableCell>
                              <TableCell className="text-right">
                                {formatCop(section.total)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cashflow" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Flujo de caja operativo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Entradas</p>
                      <p className="text-xl font-bold text-green-600">
                        {formatCop(reports.cashFlow.operatingInflows)}
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Salidas</p>
                      <p className="text-xl font-bold text-red-600">
                        {formatCop(reports.cashFlow.operatingOutflows)}
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Neto</p>
                      <p className="text-xl font-bold">
                        {formatCop(reports.cashFlow.netOperating)}
                      </p>
                    </div>
                  </div>
                  {reports.cashFlow.byMonth.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mes</TableHead>
                          <TableHead className="text-right">Entradas</TableHead>
                          <TableHead className="text-right">Salidas</TableHead>
                          <TableHead className="text-right">Neto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reports.cashFlow.byMonth.map((row) => (
                          <TableRow key={row.month}>
                            <TableCell>{row.month}</TableCell>
                            <TableCell className="text-right text-green-600">
                              {formatCop(row.inflow)}
                            </TableCell>
                            <TableCell className="text-right text-red-600">
                              {formatCop(row.outflow)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCop(row.net)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="vat" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Resumen IVA — {reports.vatSummary.periodLabel}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell>IVA generado (ventas)</TableCell>
                        <TableCell className="text-right">
                          {formatCop(reports.vatSummary.vatGenerated)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>IVA descontable (compras)</TableCell>
                        <TableCell className="text-right">
                          {formatCop(reports.vatSummary.vatDeductible)}
                        </TableCell>
                      </TableRow>
                      <TableRow className="font-bold">
                        <TableCell>IVA neto a pagar / a favor</TableCell>
                        <TableCell className="text-right">
                          {formatCop(reports.vatSummary.netVat)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  <p className="text-sm text-muted-foreground">
                    Reporte preparatorio. Valide con su contador antes de presentar ante la DIAN.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      ) : null}
    </div>
  );
}
