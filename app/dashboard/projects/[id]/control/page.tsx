"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  ArrowLeft,
  FolderKanban,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Plus,
  Clock,
  Layers,
  Edit2,
} from "lucide-react";
import * as actualFlowsService from "@/lib/services/actual-flows";
import { routes } from "@/lib/routes";

interface Props {
  params: Promise<{ id: string }>;
}

export default function ProjectControlPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const [report, setReport] = useState<actualFlowsService.VarianceReportSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado del modal de registro de flujos reales
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    period: 1,
    inflow: 0,
    outflow: 0,
    accountCode: "",
    notes: "",
  });

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await actualFlowsService.getVarianceReport(id);
      setReport(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al cargar el control operativo.");
      toast.error("Error al cargar los flujos del proyecto.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [id]);

  const openRecordModal = (period?: number, existingInflow?: number, existingOutflow?: number) => {
    setFormData({
      period: period ?? 1,
      inflow: existingInflow ?? 0,
      outflow: existingOutflow ?? 0,
      accountCode: "",
      notes: "",
    });
    setIsDialogOpen(true);
  };

  const handleSaveActualFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await actualFlowsService.recordActualFlow(
        id,
        Number(formData.period),
        Number(formData.inflow || 0),
        Number(formData.outflow || 0),
        formData.accountCode,
        formData.notes,
      );
      toast.success(`Flujo real del Período ${formData.period} registrado.`);
      setIsDialogOpen(false);
      await loadData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al registrar el flujo real.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando control y seguimiento operativo...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 text-center">
        <p className="text-base text-destructive font-medium">{error || "Proyecto no disponible."}</p>
        <Button variant="outline" asChild>
          <Link href={routes.projects}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Proyectos
          </Link>
        </Button>
      </div>
    );
  }

  // Datos para el gráfico de líneas superpuestas
  const chartData = report.items.map((item) => ({
    period: `Año ${item.period}`,
    proyectado: item.projectedNet,
    real: item.hasActualData ? item.actualNet : null,
  }));

  const npvDifference = report.actualizedNpv - report.projectedNpv;

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* 1. Encabezado */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link
              href={routes.projects}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <FolderKanban className="h-3.5 w-3.5" />
              Proyectos
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium truncate max-w-[200px]">
              {report.projectName}
            </span>
            <span>/</span>
            <span className="text-foreground font-medium">Control Operativo</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Control: Real vs. Proyectado
            </h1>
            <Badge variant="outline" className="text-xs">
              <Activity className="w-3 h-3 mr-1 text-emerald-500" />
              Seguimiento Ex-Post
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Comparativa período a período entre el flujo de caja esperado en la evaluación y la ejecución financiera real.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => openRecordModal()} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Registrar Flujo Real
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={routes.projectInvestment(id)}>
              <Layers className="mr-2 h-4 w-4" />
              Ver CAPEX
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. Tarjetas KPI de Evaluación */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              VPN Original Proyectado
            </CardTitle>
            <DollarSign className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${report.projectedNpv.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Basado 100% en estimaciones iniciales
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              VPN Actualizado
            </CardTitle>
            <Activity className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                report.actualizedNpv >= 0 ? "text-emerald-600" : "text-destructive"
              }`}
            >
              ${report.actualizedNpv.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Integrando datos ejecutados a la fecha
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Impacto en Rentabilidad
            </CardTitle>
            {npvDifference >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-destructive" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                npvDifference >= 0 ? "text-emerald-600" : "text-destructive"
              }`}
            >
              {npvDifference >= 0 ? "+" : ""}
              ${npvDifference.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Variación en valor generado
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Desviación Neta Acumulada
            </CardTitle>
            <AlertTriangle
              className={`w-4 h-4 ${
                report.netVariance >= 0 ? "text-emerald-500" : "text-amber-500"
              }`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                report.netVariance >= 0 ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              {report.netVariance >= 0 ? "+" : ""}
              ${report.netVariance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Flujo de caja neto real vs presupuestado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Panel de Alertas de Desviación */}
      {report.alerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Alertas de Desviación Relevantes
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {report.alerts.map((alert, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border text-sm flex items-start gap-3 ${
                  alert.type === "danger"
                    ? "bg-destructive/5 border-destructive/20 text-destructive dark:text-red-400"
                    : "bg-emerald-500/5 border-emerald-500/20 text-emerald-800 dark:text-emerald-400"
                }`}
              >
                {alert.type === "danger" ? (
                  <TrendingDown className="w-5 h-5 shrink-0 mt-0.5 text-destructive" />
                ) : (
                  <TrendingUp className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
                )}
                <div>
                  <div className="font-semibold">{alert.title}</div>
                  <div className="text-xs opacity-90 mt-0.5">{alert.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Gráfico de Líneas Superpuestas */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Evolución de Flujos Netos: Proyectado vs. Real
          </CardTitle>
          <CardDescription>
            Compara la trayectoria de generación de flujo de caja libre período a período
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="period" tickLine={false} />
                <YAxis
                  tickFormatter={(val) => `$${Number(val) >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, ""]}
                  contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.95)", borderRadius: "8px" }}
                />
                <Legend verticalAlign="top" height={36} />
                <Line
                  type="monotone"
                  dataKey="proyectado"
                  name="Flujo Neto Proyectado"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="real"
                  name="Flujo Neto Real"
                  stroke="#10b981"
                  strokeWidth={3}
                  connectNulls={false}
                  dot={{ r: 5, fill: "#10b981" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 5. Tabla Comparativa por Período */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Tabla Comparativa por Período</CardTitle>
          <CardDescription>
            Análisis detallado de ingresos, egresos, flujo neto y porcentaje de varianza
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Período</TableHead>
                  <TableHead className="text-right">Ingreso Proy.</TableHead>
                  <TableHead className="text-right">Ingreso Real</TableHead>
                  <TableHead className="text-right">Egreso Proy.</TableHead>
                  <TableHead className="text-right">Egreso Real</TableHead>
                  <TableHead className="text-right">Neto Proy.</TableHead>
                  <TableHead className="text-right">Neto Real</TableHead>
                  <TableHead className="text-right">Desviación ($)</TableHead>
                  <TableHead className="text-right">Varianza (%)</TableHead>
                  <TableHead className="text-right w-24">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.items.map((row) => (
                  <TableRow key={row.period}>
                    <TableCell className="font-semibold">Año {row.period}</TableCell>
                    <TableCell className="text-right">${row.projectedInflow.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-medium text-emerald-600">
                      {row.hasActualData ? `$${row.actualInflow.toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell className="text-right">${row.projectedOutflow.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-medium text-rose-600">
                      {row.hasActualData ? `$${row.actualOutflow.toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${row.projectedNet.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {row.hasActualData ? `$${row.actualNet.toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold ${
                        !row.hasActualData
                          ? "text-muted-foreground"
                          : row.varianceNet >= 0
                          ? "text-emerald-600"
                          : "text-rose-600"
                      }`}
                    >
                      {row.hasActualData
                        ? `${row.varianceNet >= 0 ? "+" : ""}$${row.varianceNet.toLocaleString()}`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.hasActualData ? (
                        <Badge
                          variant={
                            row.status === "favorable"
                              ? "default"
                              : row.status === "desfavorable"
                              ? "destructive"
                              : "secondary"
                          }
                          className={
                            row.status === "favorable"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                              : ""
                          }
                        >
                          {row.variancePercent >= 0 ? "+" : ""}
                          {row.variancePercent}%
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Pendiente</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 text-xs"
                        onClick={() => openRecordModal(row.period, row.actualInflow, row.actualOutflow)}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        {row.hasActualData ? "Modificar" : "Cargar"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Dialog para Registrar Flujo Real */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <form onSubmit={handleSaveActualFlow}>
            <DialogHeader>
              <DialogTitle>Registrar Flujo Real - Período {formData.period}</DialogTitle>
              <DialogDescription>
                Ingresa los valores consolidados reales de ingresos y egresos para este período contable.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="period">Período / Año</Label>
                <Input
                  id="period"
                  type="number"
                  min="1"
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inflow">Ingreso Real ($)</Label>
                  <Input
                    id="inflow"
                    type="number"
                    min="0"
                    step="any"
                    value={formData.inflow}
                    onChange={(e) => setFormData({ ...formData, inflow: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="outflow">Egreso Real ($)</Label>
                  <Input
                    id="outflow"
                    type="number"
                    min="0"
                    step="any"
                    value={formData.outflow}
                    onChange={(e) => setFormData({ ...formData, outflow: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountCode">
                  Código PUC / Cuenta <span className="text-xs text-muted-foreground">(Opcional)</span>
                </Label>
                <Input
                  id="accountCode"
                  placeholder="ej. 4135 - Comercio"
                  value={formData.accountCode}
                  onChange={(e) => setFormData({ ...formData, accountCode: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas / Justificación de Desviación</Label>
                <Input
                  id="notes"
                  placeholder="ej. Incremento por demanda estacional mayor a la prevista"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar Registro"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
